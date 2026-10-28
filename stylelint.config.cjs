module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-standard-vue/scss'],
  rules: {
    'selector-class-pattern': null,
    'scss/dollar-variable-pattern': null,
    // The iOS app targets iOS 15; range syntax (width >= 600px) needs Safari 16.4
    'media-feature-range-notation': 'prefix',
    // Safari (iOS WebView) still needs these prefixes
    'property-no-vendor-prefix': [
      true,
      { ignoreProperties: [/^-(webkit|moz|ms)-(backdrop-filter|user-select|text-size-adjust)$/] },
    ],
    'media-feature-name-no-vendor-prefix': null,
  },
}
