export const toPascalCase=(str)=>{
  return str
    .replace(/(\w)(\w*)/g, function (_, firstChar, restChars) {
      return firstChar.toUpperCase() + restChars.toLowerCase();
    })
    .replace(/\s+/g, '');
}
