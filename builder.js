/*
 * Custom Email Template Builder
 *
 * This script powers the interactive builder defined in builder.html.  It
 * dynamically loads a set of pre‑defined templates, generates form
 * c
 (() => {
  const style = document.createElement('style');
  style.textContent = `
    body { background-color:#0f172a; color:#f3f4f6; margin:0; height:100vh; display:flex; overflow-y:auto; font-family:'Inter','Helvetica Neue',Arial,sans-serif; }
    #app-container { display:flex; width:100%; min-height:100vh; }
    #sidebar { width:280px; background-color:#15213a; padding:20px; overflow-y:auto; box-sizing:border-box; }
    #sidebar h1 { color:#f3f4f6; font-size:20px; margin:0 0 12px; font-weight:600; }
    #sidebar label { color:#94a3b8; font-size:13px; margin:8px 0 4px; display:block; }
    #sidebar input, #sidebar select, #sidebar textarea { width:100%; background-color:#1e293b; color:#f3f4f6; border:1px solid #2e3a5d; border-radius:5px; padding:8px 10px; margin-bottom:10px; font-size:14px; box-sizing:border-box; }
    #sidebar textarea { resize:vertical; min-height:60px; max-height:200px; }
    #sidebar button { width:100%; padding:10px; margin-top:14px; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; color:#fff; background-image:linear-gradient(135deg,#806af6,#3b82f6); transition:opacity .2s; }
    #sidebar button:hover { opacity:0.85; }
    .add-bubble-button { background-image:linear-gradient(135deg,#22c55e,#3abff8); }
    #preview-container { flex:1; padding:20px; background-color:#1e293b; overflow-y:auto; box-sizing:border-box; }
    #preview-container h2 { color:#f3f4f6; font-size:20px; margin:0 0 12px; font-weight:600; }
    #preview-frame { width:100%; height:calc(100vh - 80px); border:1px solid #2e3a5d; border-radius:6px; background-color:#15213a; }
    .message-field { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .message-field input[type="text"], .message-field select, .message-field input[type="color"], .message-field input[type="number"] { background-color:#1e293b; color:#f3f4f6; border:1px solid #2e3a5d; border-radius:5px; padding:6px 8px; font-size:14px; }
  `;
  document.head.appendChild(style);
  const cssLink = document.querySelector('link[rel="stylesheet"][href*="builder.css"]');
  if (cssLink) {
    const clean = cssLink.getAttribute('href').split('?')[0];
    cssLink.setAttribute('href', clean + '?v=' + Date.now());
  }
})();

ontrols for user customization, updates a live preview, and exports a
 * finished template as a ZIP package.  The ZIP includes the HTML
 * template, any images the user selected, and a plain text file with
 * instructions for uploading the template to HubSpot.  Default hero
 * images are loaded from `email_images_base64.json` at runtime.
 */

document.addEventListener('DOMContentLoaded', () => {
 
      // Force refresh of CSS 
 by appending query parameter
    const stylesheetLink = document.querySelector('link[rel="stylesheet"][href*="builder.css"]');
    if (stylesheetLink) {
        const href = stylesheetLink.getAttribute('href');
        if (!href.includes('?')) {
            stylesheetLink.setAttribute('href', href + '?v=2');
 
            // Ensure CSS refresh after retrieving elements
    const linkEl2 = document.querySelector('link[rel="stylesheet"][href*="builder.css"]');
    if (linkEl2) {
        const href2 = linkEl2.getAttribute('href');
        if (!href2.includes('?')) {
            linkEl2.setAttribute('href', href2 + '?v=3');
        }
    }
}
    }
const templateSelect = document.getElementById('template-select');
  const fieldsContainer = document.getElementById('fields-container');
  const previewFrame = document.getElementById('preview-frame');
  const exportButton = document.getElementById('export-button');

  // Container for base64 encoded default images.  These are filled by
  // reading email_images_base64.json on load.  Each property should be a
  // Data URI string (e.g. "data:image/jpeg;base64,...").
  const baseImages = {};

  // Internal state tracking.  `currentTemplate` holds the active template
  // definition, `currentValues` stores the values of fields for that
  // template, and `chatMessages` is used only for the chat template to
  // store individual message objects.
  let templates = [];
  let currentTemplate = null;
  let currentValues = {};
  let chatMessages = [];

  /**
   * Utility to convert a hex color and opacity percentage into an RGBA
   * string.  `hex` should be in the form `#RRGGBB` and `opacity` a
   * floating point number between 0 and 1.  If the inputs are invalid
   * defaults are used.
   */
  function hexToRgba(hex, opacity) {
    let h = (hex || '#ffffff').replace('#', '');
    if (h.length === 3) {
      // Expand short
     hand colors (e.g. #abc to #aabbcc)
      h = h.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const a = typeof opacity === 'number' ? opacity : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Convert a Data URI into a Blob.  Used when constructing the ZIP
   * archive during export.  Supports base64 encoded URIs.
   */
  function dataURLToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const b64 = parts[1];
    const binary = atob(b64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  /**
   * Extract the file extension from a Data URI.  For example, given
   * "data:image/jpeg;base64,..." returns "jpeg".  Falls back to
   * "png" if parsing fails.
   */
  function getFileExtension(dataUrl) {
    const match = dataUrl.match(/^data:([\w\/]+);/);
    if (match) {
      const mime = match[1];
      const ext = mime.split('/')[1];
      return ext || 'png';
    }
    return 'png';
  }

  /**
   * Initialize the builder after default images are loaded.  This sets up
   * the available templates, populates the template selection dropdown,
   * initializes values, creates input fields and binds event handlers.
   */
  function initBuilder() {
    // Definition of all templates available in the builder.  Each
    // template describes its ID, display name, a set of fields and
    // functions to build the HTML and describe which images need to be
    // exported.  See individual templates for details.
    templates = [
      {
        id: 'template1',
        name: 'Elegant Hero',
        fields: [
          { label: 'Hero Image', name: 'heroImg', type: 'image', default: baseImages.hero1 || '' },
          { label: 'Heading Text', name: 'heading', type: 'text', default: 'Welcome to Our Product' },
          { label: 'Body Text', name: 'body', type: 'textarea', default: 'Discover the features that will change your workflow.' },
          { label: 'Button Text', name: 'buttonText', type: 'text', default: 'Learn More' },
          { label: 'Button Color', name: 'buttonColor', type: 'color', default: '#007bff' },
          { label: 'Background Color', name: 'bgColor', type: 'color', default: '#ffffff' },
          { label: 'Background Opacity (%)', name: 'bgOpacity', type: 'number', default: '100', min: 0, max: 100 },
          { label: 'Company Name', name: 'companyName', type: 'text', default: 'Your Company' },
          { label: 'Company Address', name: 'companyAddress', type: 'text', default: '123 Main Street, City, Country' },
          { label: 'Year', name: 'year', type: 'text', default: new Date().getFullYear().toString() }
        ],
        /**
         * Build the HTML string for Template 1.  Accepts user values and
         * optional export information.  When `options.export` is true
         * the returned HTML references images in an `images/` folder
         * instead of embedding Data URIs directly.  The caller must
         * supply `options.imageFiles` mapping image field names to
         * filenames written into the ZIP.
         */
        buildHtml: function (values, options = {}) {
          const exportMode = options.export || false;
          const imageFiles = options.imageFiles || {};
          const heroSrc = exportMode ? (`images/` + (imageFiles.heroImg || 'heroImg.jpg')) : (values.heroImg || baseImages.hero1 || '');
          const bgOpacity = parseInt(values.bgOpacity, 10);
          const bgRgba = hexToRgba(values.bgColor || '#ffffff', isNaN(bgOpacity) ? 1 : bgOpacity / 100);
          const yearVal = values.year || new Date().getFullYear();
          const heading = values.heading || '';
          const body = values.body ? values.body.replace(/\n/g, '<br>') : '';
          const buttonText = values.buttonText || '';
          const buttonColor = values.buttonColor || '#007bff';
          const companyName = values.companyName || '';
          const companyAddress = values.companyAddress || '';
          return `<!DOCTYPE html>` +
            `<html><head><meta charset="UTF-8"><title>${heading}</title></head>` +
            `<body style="margin:0;padding:0;background-color:${bgRgba};">` +
            `<center>` +
            `<table width="600" cellpadding="0" cellspacing="0" style="margin:auto;background-color:#ffffff;border-collapse:collapse;font-family:Arial, sans-serif;">` +
            `<tr><td><img src="${heroSrc}" alt="" width="600" style="display:block;border:0;width:100%;height:auto;"></td></tr>` +
            `<tr><td style="padding:20px;text-align:center;">` +
            `<h1 style="font-size:28px;color:#333333;margin:0 0 10px;">${heading}</h1>` +
            `<p style="font-size:16px;line-height:24px;color:#555555;margin:0 0 20px;">${body}</p>` +
            `<a href="#" style="display:inline-block;background-color:${buttonColor};color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;">${buttonText}</a>` +
            `</td></tr>` +
            `<tr><td style="padding:30px 20px;font-size:12px;color:#888888;text-align:center;">` +
            `<p style="margin:0;">&copy; ${yearVal} ${companyName}. ${companyAddress}</p>` +
            `<p style="margin:5px 0;"><a href="{{ unsubscribe_link }}" style="color:#888888;text-decoration:underline;">Unsubscribe</a></p>` +
            `</td></tr>` +
            `</table>` +
            `</center></body></html>`;
        },
        /**
         * Return a map of images that should be included in the export
         * package for this template.  Each entry maps a field name to
         * the Data URI currently stored in `values`.  Missing or empty
         * images are omitted.  The keys correspond to the names used in
         * the HTML builder (e.g. heroImg) and will be used to name the
         * output files when generating the ZIP.
         */
        requiredImages: function (values) {
          const images = {};
          if (values.heroImg) images.heroImg = values.heroImg;
          return images;
        }
      },
      {
        id: 'template2',
        name: 'Newsletter Features',
        fields: [
          { label: 'Hero Image', name: 'heroImg2', type: 'image', default: baseImages.hero2 || '' },
          { label: 'Header Title', name: 'headerTitle', type: 'text', default: 'Latest News and Updates' },
          { label: 'Header Subtitle', name: 'headerSubtitle', type: 'textarea', default: 'Stay up‑to‑date with our product.' },
          { label: 'Feature 1 Title', name: 'feature1Title', type: 'text', default: 'Feature One' },
          { label: 'Feature 1 Description', name: 'feature1Desc', type: 'textarea', default: 'Describe feature one here.' },
          { label: 'Feature 1 Image', name: 'feature1Img', type: 'image', default: baseImages.hero3 || '' },
          { label: 'Feature 2 Title', name: 'feature2Title', type: 'text', default: 'Feature Two' },
          { label: 'Feature 2 Description', name: 'feature2Desc', type: 'textarea', default: 'Describe feature two here.' },
          { label: 'Feature 2 Image', name: 'feature2Img', type: 'image', default: baseImages.hero3 || '' },
          { label: 'Feature 3 Title', name: 'feature3Title', type: 'text', default: 'Feature Three' },
          { label: 'Feature 3 Description', name: 'feature3Desc', type: 'textarea', default: 'Describe feature three here.' },
          { label: 'Feature 3 Image', name: 'feature3Img', type: 'image', default: baseImages.hero3 || '' },
          { label: 'Button Text', name: 'buttonText2', type: 'text', default: 'Get Started' },
          { label: 'Button Color', name: 'buttonColor2', type: 'color', default: '#007bff' },
          { label: 'Background Color', name: 'bgColor2', type: 'color', default: '#ffffff' },
          { label: 'Company Name', name: 'companyName2', type: 'text', default: 'Your Company' },
          { label: 'Company Address', name: 'companyAddress2', type: 'text', default: '123 Main Street, City, Country' },
          { label: 'Year', name: 'year2', type: 'text', default: new Date().getFullYear().toString() }
        ],
        /** Build HTML for Template 2 (Newsletter Features). */
        buildHtml: function (values, options = {}) {
          const exportMode = options.export || false;
          const files = options.imageFiles || {};
          // Determine sources for each image field
          const heroSrc = exportMode ? (`images/` + (files.heroImg2 || 'heroImg2.jpg')) : (values.heroImg2 || baseImages.hero2 || '');
          const f1Src = exportMode ? (`images/` + (files.feature1Img || 'feature1Img.jpg')) : (values.feature1Img || baseImages.hero3 || '');
          const f2Src = exportMode ? (`images/` + (files.feature2Img || 'feature2Img.jpg')) : (values.feature2Img || baseImages.hero3 || '');
          const f3Src = exportMode ? (`images/` + (files.feature3Img || 'feature3Img.jpg')) : (values.feature3Img || baseImages.hero3 || '');
          const headerTitle = values.headerTitle || '';
          const headerSubtitle = values.headerSubtitle ? values.headerSubtitle.replace(/\n/g, '<br>') : '';
          const ft1Title = values.feature1Title || '';
          const ft1Desc = values.feature1Desc ? values.feature1Desc.replace(/\n/g, '<br>') : '';
          const ft2Title = values.feature2Title || '';
          const ft2Desc = values.feature2Desc ? values.feature2Desc.replace(/\n/g, '<br>') : '';
          const ft3Title = values.feature3Title || '';
          const ft3Desc = values.feature3Desc ? values.feature3Desc.replace(/\n/g, '<br>') : '';
          const buttonText = values.buttonText2 || '';
          const buttonColor = values.buttonColor2 || '#007bff';
          const bgColor = values.bgColor2 || '#ffffff';
          const yearVal = values.year2 || new Date().getFullYear();
          const companyName = values.companyName2 || '';
          const companyAddress = values.companyAddress2 || '';
          return `<!DOCTYPE html>` +
            `<html><head><meta charset="UTF-8"><title>${headerTitle}</title></head>` +
            `<body style="margin:0;padding:0;background-color:${bgColor};">` +
            `<center>` +
            `<table width="600" cellpadding="0" cellspacing="0" style="margin:auto;background-color:#ffffff;border-collapse:collapse;font-family:Arial, sans-serif;">` +
            `<tr><td><img src="${heroSrc}" alt="" width="600" style="display:block;border:0;width:100%;height:auto;"></td></tr>` +
            `<tr><td style="padding:20px;text-align:center;">` +
            `<h1 style="font-size:26px;color:#333333;margin:0 0 8px;">${headerTitle}</h1>` +
            `<p style="font-size:16px;line-height:24px;color:#555555;margin:0 0 20px;">${headerSubtitle}</p>` +
            `</td></tr>` +
            `<tr><td style="padding:10px;">` +
            `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
            `<tr>` +
            `<td width="33%" style="padding:10px;text-align:center;">` +
            `<img src="${f1Src}" alt="" width="80" style="display:block;margin:auto 0 10px;">` +
            `<h3 style="font-size:18px;color:#333333;margin:0 0 5px;">${ft1Title}</h3>` +
            `<p style="font-size:14px;line-height:20px;color:#555555;margin:0;">${ft1Desc}</p>` +
            `</td>` +
            `<td width="33%" style="padding:10px;text-align:center;">` +
            `<img src="${f2Src}" alt="" width="80" style="display:block;margin:auto 0 10px;">` +
            `<h3 style="font-size:18px;color:#333333;margin:0 0 5px;">${ft2Title}</h3>` +
            `<p style="font-size:14px;line-height:20px;color:#555555;margin:0;">${ft2Desc}</p>` +
            `</td>` +
            `<td width="33%" style="padding:10px;text-align:center;">` +
            `<img src="${f3Src}" alt="" width="80" style="display:block;margin:auto 0 10px;">` +
            `<h3 style="font-size:18px;color:#333333;margin:0 0 5px;">${ft3Title}</h3>` +
            `<p style="font-size:14px;line-height:20px;color:#555555;margin:0;">${ft3Desc}</p>` +
            `</td>` +
            `</tr>` +
            `</table>` +
            `</td></tr>` +
            `<tr><td style="padding:20px;text-align:center;">` +
            `<a href="#" style="display:inline-block;background-color:${buttonColor};color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;">${buttonText}</a>` +
            `</td></tr>` +
            `<tr><td style="padding:30px 20px;font-size:12px;color:#888888;text-align:center;">` +
            `<p style="margin:0;">&copy; ${yearVal} ${companyName}. ${companyAddress}</p>` +
            `<p style="margin:5px 0;"><a href="{{ unsubscribe_link }}" style="color:#888888;text-decoration:underline;">Unsubscribe</a></p>` +
            `</td></tr>` +
            `</table>` +
            `</center></body></html>`;
        },
        requiredImages: function (values) {
          const imgs = {};
          if (values.heroImg2) imgs.heroImg2 = values.heroImg2;
          if (values.feature1Img) imgs.feature1Img = values.feature1Img;
          if (values.feature2Img) imgs.feature2Img = values.feature2Img;
          if (values.feature3Img) imgs.feature3Img = values.feature3Img;
          return imgs;
        }
      },
      {
        id: 'template3',
        name: 'Chat Conversation',
        fields: [
          { label: 'Hero Image', name: 'heroImg3', type: 'image', default: baseImages.hero3 || '' },
          { label: 'Chat Title', name: 'chatTitle', type: 'text', default: 'Conversation with Support' },
          { label: 'Chat Background Color', name: 'chatBgColor', type: 'color', default: '#f5f5f5' },
          { label: 'Chat Background Opacity (%)', name: 'chatBgOpacity', type: 'number', default: '100', min: 0, max: 100 },
          { label: 'Button Text', name: 'buttonText3', type: 'text', default: 'Contact Us' },
          { label: 'Button Color', name: 'buttonColor3', type: 'color', default: '#007bff' },
          { label: 'Company Name', name: 'companyName3', type: 'text', default: 'Your Company' },
          { label: 'Company Address', name: 'companyAddress3', type: 'text', default: '123 Main Street, City, Country' },
          { label: 'Year', name: 'year3', type: 'text', default: new Date().getFullYear().toString() }
        ],
        /** Build HTML for chat conversation template (Template 3). */
        buildHtml: function (values, options = {}) {
          const exportMode = options.export || false;
          const files = options.imageFiles || {};
          const heroSrc = exportMode ? (`images/` + (files.heroImg3 || 'heroImg3.jpg')) : (values.heroImg3 || baseImages.hero2 || '');
          const chatTitle = values.chatTitle || '';
          const chatBgOpacity = parseInt(values.chatBgOpacity, 10);
          const chatBgRgba = hexToRgba(values.chatBgColor || '#f5f5f5', isNaN(chatBgOpacity) ? 1 : chatBgOpacity / 100);
          const btnText = values.buttonText3 || '';
          const btnColor = values.buttonColor3 || '#007bff';
          const yearVal = values.year3 || new Date().getFullYear();
          const companyName = values.companyName3 || '';
          const companyAddress = values.companyAddress3 || '';
          // Build conversation rows
          const msgRows = chatMessages.map(msg => {
            const msgColor = hexToRgba(msg.color || '#f1f1f1', (msg.opacity || 100) / 100);
            const msgText = msg.text ? msg.text.replace(/\n/g, '<br>') : '';
            const align = msg.side === 'right' ? 'right' : 'left';
            return `<tr><td align="${align}"><table style="max-width:80%;"><tr><td style="background-color:${msgColor};padding:10px;border-radius:10px;margin:5px 0;font-size:14px;color:#333333;">${msgText}</td></tr></table></td></tr>`;
          }).join('');
          return `<!DOCTYPE html>` +
            `<html><head><meta charset="UTF-8"><title>${chatTitle}</title></head>` +
            `<body style="margin:0;padding:0;background-color:#ffffff;">` +
            `<center>` +
            `<table width="600" cellpadding="0" cellspacing="0" style="margin:auto;background-color:#ffffff;border-collapse:collapse;font-family:Arial, sans-serif;">` +
            `<tr><td><img src="${heroSrc}" alt="" width="600" style="display:block;border:0;width:100%;height:auto;"></td></tr>` +
            `<tr><td style="padding:20px;text-align:center;">` +
            `<h2 style="font-size:24px;color:#333333;margin:0 0 10px;">${chatTitle}</h2>` +
            `</td></tr>` +
            `<tr><td style="padding:20px;background-color:${chatBgRgba};">` +
            `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${msgRows}</table>` +
            `</td></tr>` +
            `<tr><td style="padding:20px;text-align:center;">` +
            `<a href="#" style="display:inline-block;background-color:${btnColor};color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;">${btnText}</a>` +
            `</td></tr>` +
            `<tr><td style="padding:30px 20px;font-size:12px;color:#888888;text-align:center;">` +
            `<p style="margin:0;">&copy; ${yearVal} ${companyName}. ${companyAddress}</p>` +
            `<p style="margin:5px 0;"><a href="{{ unsubscribe_link }}" style="color:#888888;text-decoration:underline;">Unsubscribe</a></p>` +
            `</td></tr>` +
            `</table>` +
            `</center></body></html>`;
        },
        requiredImages: function (values) {
          const imgs = {};
          if (values.heroImg3) imgs.heroImg3 = values.heroImg3;
          return imgs;
        }
      }
    ];

    // Populate the template selection dropdown
    templateSelect.innerHTML = '';
    templates.forEach(tpl => {
      const opt = document.createElement('option');
      opt.value = tpl.id;
      opt.textContent = tpl.name;
      templateSelect.appendChild(opt);
    });

    // Set the initial template
    currentTemplate = templates[0];
    initializeValues(currentTemplate);
    loadFields(currentTemplate);
    updatePreview();

    // Attach event handlers
    templateSelect.addEventListener('change', () => {
      const selectedId = templateSelect.value;
      const tpl = templates.find(t => t.id === selectedId);
      if (tpl) {
        currentTemplate = tpl;
        initializeValues(currentTemplate);
        loadFields(currentTemplate);
        updatePreview();
      }
    });

    fieldsContainer.addEventListener('input', () => {
      updatePreview();
    });
    fieldsContainer.addEventListener('change', () => {
      updatePreview();
    });

    exportButton.addEventListener('click', () => {
      exportTemplate();
    });
  }

  /**
   * Initialize the current values for the selected template.  Copies
   * default values from the template definition into the `currentValues`
   * object and resets any chat messages.  For the chat template a
   * couple of example messages are provided as a starting point.
   */
  function initializeValues(template) {
    currentValues = {};
    template.fields.forEach(field => {
      currentValues[field.name] = field.default;
    });
    if (template.id === 'template3') {
      chatMessages = [
        { text: 'Hi there! Need help with your order?', side: 'left', color: '#f1f1f1', opacity: 100 },
        { text: 'Yes, please provide more info.', side: 'right', color: '#d0e6ff', opacity: 100 }
      ];
    } else {
      chatMessages = [];
    }
  }

  /**
   * Create input fields for the currently selected template.  For
   * standard templates this iterates over the `fields` array and
   * constructs controls accordingly.  For the chat template a special
   * interface is built that allows users to add, remove and edit chat
   * bubbles.
   */
  function loadFields(template) {
    fieldsContainer.innerHTML = '';
    if (template.id === 'template3') {
      // Build fields for chat template
      template.fields.forEach(field => {
        createField(field);
      });
      // Message list heading
      const msgLabel = document.createElement('h3');
      msgLabel.textContent = 'Messages';
      fieldsContainer.appendChild(msgLabel);
      // Container for message fields
      const msgContainer = document.createElement('div');
      msgContainer.id = 'message-container';
      fieldsContainer.appendChild(msgContainer);
      // Add bubble button
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'add-bubble-button';
      addBtn.textContent = 'Add Message';
      addBtn.addEventListener('click', () => {
        chatMessages.push({ text: '', side: 'left', color: '#f1f1f1', opacity: 100 });
        renderMessages();
        updatePreview();
      });
      fieldsContainer.appendChild(addBtn);
      // Initially render messages
      renderMessages();
    } else {
      // Build fields for non‑chat templates
      template.fields.forEach(field => {
        createField(field);
      });
    }
  }

  /**
   * Helper to construct a single form control group for a field.  This
   * function appends a label and appropriate input element(s) to the
   * fields container.  It also binds change handlers that update the
   * `currentValues` object whenever the user changes a value.
   */
  function createField(field) {
    const group = document.createElement('div');
    group.className = 'field-group';
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = field.name;
    group.appendChild(label);
    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = field.name;
      input.value = currentValues[field.name] || '';
      input.addEventListener('input', () => {
        currentValues[field.name] = input.value;
        updatePreview();
      });
    } else if (field.type === 'image') {
      // For image fields we use a file input and display a small preview
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.id = field.name;
      const preview = document.createElement('img');
      preview.style.width = '100%';
      preview.style.maxHeight = '120px';
      preview.style.objectFit = 'cover';
      preview.style.border = '1px solid #ccc';
      preview.style.marginTop = '5px';
      // Set initial preview
      if (currentValues[field.name]) {
        preview.src = currentValues[field.name];
      } else if (field.default) {
        preview.src = field.default;
        currentValues[field.name] = field.default;
      }
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            currentValues[field.name] = e.target.result;
            preview.src = e.target.result;
            updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
      group.appendChild(input);
      group.appendChild(preview);
      fieldsContainer.appendChild(group);
      return;
    } else if (field.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.id = field.name;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      input.value = currentValues[field.name] || field.default || 0;
      input.addEventListener('input', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val)) val = parseInt(field.default, 10) || 0;
        if (field.min !== undefined && val < field.min) val = field.min;
        if (field.max !== undefined && val > field.max) val = field.max;
        currentValues[field.name] = val.toString();
        updatePreview();
      });
    } else if (field.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.id = field.name;
      input.value = currentValues[field.name] || field.default || '#ffffff';
      input.addEventListener('change', () => {
        currentValues[field.name] = input.value;
        updatePreview();
      });
    } else {
      // Default to text input
      input = document.createElement('input');
      input.type = 'text';
      input.id = field.name;
      input.value = currentValues[field.name] || field.default || '';
      input.addEventListener('input', () => {
        currentValues[field.name] = input.value;
        updatePreview();
      });
    }
    group.appendChild(input);
    fieldsContainer.appendChild(group);
  }

  /**
   * Render the current chat messages into the message container for
   * Template 3.  This function creates input fields for text, side,
   * color and opacity along with a button to remove each message.
   */
  function renderMessages() {
    const msgContainer = document.getElementById('message-container');
    if (!msgContainer) return;
    msgContainer.innerHTML = '';
    chatMessages.forEach((msg, idx) => {
      const row = document.createElement('div');
      row.className = 'message-field';
      // Text input
      const txt = document.createElement('input');
      txt.type = 'text';
      txt.placeholder = 'Message text';
      txt.value = msg.text;
      txt.style.flex = '1';
      txt.addEventListener('input', () => {
        chatMessages[idx].text = txt.value;
        updatePreview();
      });
      // Side select
      const sel = document.createElement('select');
      ['left', 'right'].forEach(side => {
        const opt = document.createElement('option');
        opt.value = side;
        opt.textContent = side.charAt(0).toUpperCase() + side.slice(1);
        if (msg.side === side) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.style.width = '80px';
      sel.addEventListener('change', () => {
        chatMessages[idx].side = sel.value;
        updatePreview();
      });
      // Color picker
      const color = document.createElement('input');
      color.type = 'color';
      color.value = msg.color || '#f1f1f1';
      color.addEventListener('change', () => {
        chatMessages[idx].color = color.value;
        updatePreview();
      });
      // Opacity number
      const op = document.createElement('input');
      op.type = 'number';
      op.min = '0';
      op.max = '100';
      op.style.width = '60px';
      op.value = msg.opacity || 100;
      op.addEventListener('input', () => {
        let val = parseInt(op.value, 10);
        if (isNaN(val)) val = 100;
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        chatMessages[idx].opacity = val;
        updatePreview();
      });
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.style.padding = '4px 8px';
      removeBtn.style.marginLeft = '5px';
      removeBtn.addEventListener('click', () => {
        chatMessages.splice(idx, 1);
        renderMessages();
        updatePreview();
      });
      // Append all elements to row
      row.appendChild(txt);
      row.appendChild(sel);
      row.appendChild(color);
      row.appendChild(op);
      row.appendChild(removeBtn);
      msgContainer.appendChild(row);
    });
  }

  /**
   * Compute an object containing all field values for the current
   * template.  For the chat template this includes the `messages`
   * property referencing the array of chat message objects.
   */
  function getValues() {
    const vals = Object.assign({}, currentValues);
    if (currentTemplate.id === 'template3') {
      vals.messages = chatMessages.slice();
    }
    return vals;
  }

  /**
   * Update the live preview iframe with the current values and
   * template.  Calls the template's buildHtml function to produce
   * HTML and sets it via srcdoc on the iframe.
   */
  function updatePreview() {
    if (!currentTemplate) return;
    const html = currentTemplate.buildHtml(getValues(), { export: false });
    previewFrame.srcdoc = html;
  }

  /**
   * Generate a ZIP file containing the HTML template, any images
   * referenced in the template, and a plain text instructions file.
   * Prompts the user to download the resulting .zip archive.
   */
  function exportTemplate() {
    const JSZipLib = window.JSZip;
    if (!JSZipLib) {
      alert('JSZip library not loaded.');
      return;
    }
    const zip = new JSZipLib();
    const vals = getValues();
    // Collect images to export
    const images = currentTemplate.requiredImages(vals);
    const imageFiles = {};
    const imagePromises = [];
    for (const key in images) {
      const dataUrl = images[key];
      if (!dataUrl) continue;
      const ext = getFileExtension(dataUrl);
      const filename = `${key}.${ext}`;
      imageFiles[key] = filename;
      const blob = dataURLToBlob(dataUrl);
      // Write each image into images/ directory
      zip.file(`images/${filename}`, blob);
    }
    // Build HTML for export
    const htmlContent = currentTemplate.buildHtml(vals, { export: true, imageFiles });
    zip.file('template.html', htmlContent);
    // Instructions text to include in the ZIP
    const instructions = defaultInstructionsText();
    zip.file('instructions.txt', instructions);
    // Generate and trigger download
    zip.generateAsync({ type: 'blob' }).then(blob => {
      const fileName = `${currentTemplate.id}_template.zip`;
      saveAs(blob, fileName);
    });
  }

  /**
   * Returns the default instructions text explaining how to upload
   * exported templates to HubSpot.  Having this in a function allows
   * centralised editing and reuse for both the builder and static
   * instructions file.
   */
  function defaultInstructionsText() {
    return (
      'Instructions for uploading custom HTML email templates to HubSpot:\n' +
      '\n' +
      '1. Gather all image files used in your template (they are provided in the "images" folder of this zip). Before using them, you must upload the images to HubSpot\'s file manager so they become live and can be referenced in your HTML. In HubSpot, go to Marketing > Files and open the File Manager. Upload each image and copy its URL.\n' +
      '\n' +
      '2. In your HubSpot account, navigate to Content > Design Manager. Click the "File" menu, choose "New File", set the file type to "HTML + HubL", select "Email" as the template type, and give your template a name. Click "Create".\n' +
      '\n' +
      '3. Open the newly created HTML + HubL file. Replace all of the existing code with the HTML contained in the "template.html" file from this zip. In the <img> tags, update the src attributes to point to the image URLs you uploaded to the HubSpot file manager.\n' +
      '\n' +
      '4. Make sure your template includes a <tr> element in the footer with your company name, address, and the HubSpot {{ unsubscribe_link }} variable. This template already contains a default footer that uses {{ unsubscribe_link }}. Update the placeholders with your own details to comply with HubSpot\'s anti‑spam requirements.\n' +
      '\n' +
      '5. Click the "Publish changes" button to save and publish the template. Then, in the left sidebar of the Design Manager, right‑click on the template and select "Create email" to start using it. The template will load in the email editor where you can further customize content, colors, and module settings.\n' +
      '\n' +
      'For more help, refer to HubSpot’s documentation on creating custom HTML email templates.\n'
    );
  }

  // Fetch the base64 images from json file and initialise the builder
  fetch('email_images_base64.json')
    .then(res => res.json())
    .then(data => {
      baseImages.hero1 = data.hero1 ? 'data:image/jpeg;base64,' + data.hero1 : '';
      baseImages.hero2 = data.hero2 ? 'data:image/jpeg;base64,' + data.hero2 : '';
      baseImages.hero3 = data.hero3 ? 'data:image/jpeg;base64,' + data.hero3 : '';
      initBuilder();
    })
    .catch(err => {
      console.warn('Failed to load base images JSON:', err);
      baseImages.hero1 = '';
      baseImages.hero2 = '';
      baseImages.hero3 = '';
      initBuilder();
    });
});
