export class Shortener {
  private readonly alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  private readonly base = this.alphabet.length; // base is the length of the alphabet (58 in this case)
  // utility function to convert base 10 integer to base 58 string
  encode(num) {
    let encoded = '';
    while (num) {
      let remainder = num % this.base;
      num = Math.floor(num / this.base);
      encoded = this.alphabet[remainder].toString() + encoded;
    }
    return encoded;
  }
  // utility function to convert a base 58 string to base 10 integer
  decode(str) {
    let decoded = 0;
    while (str) {
      let index = this.alphabet.indexOf(str[0]);
      let power = str.length - 1;
      decoded += index * (Math.pow(this.base, power));
      str = str.substring(1);
    }
    return decoded;
  }
}