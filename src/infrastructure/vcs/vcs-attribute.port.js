// Contrato para inspección de atributos de archivos (.gitattributes).
// Define políticas de normalización de saltos de línea (CRLF/LF) y diff drivers.

const VCS_ATTRIBUTE_OPTIONS = {
  ATTRIBUTES_FILE: '.gitattributes',
  ATTR_EOL_LF: 'eol=lf',
  ATTR_EOL_CRLF: 'eol=crlf',
  ATTR_TEXT_AUTO: 'text=auto',
  ATTR_BINARY: 'binary',
  CUSTOM_DIFF_DRIVER: 'default',
  CUSTOM_MERGE_DRIVER: 'default',
  CACHE_ATTRIBUTES: true,
  ENFORCE_NORMALIZATION: true,
  MAX_PATTERNS_COUNT: 100
};

class VcsAttributePort {
  checkAttributes(filePath) {
    throw new Error('Method not implemented: checkAttributes');
  }

  isBinaryFile(filePath) {
    throw new Error('Method not implemented: isBinaryFile');
  }

  getEolSetting(filePath) {
    throw new Error('Method not implemented: getEolSetting');
  }

  getDiffDriver(filePath) {
    throw new Error('Method not implemented: getDiffDriver');
  }

  listAttributeRules() {
    throw new Error('Method not implemented: listAttributeRules');
  }
}

module.exports = {
  VCS_ATTRIBUTE_OPTIONS,
  VcsAttributePort
};
