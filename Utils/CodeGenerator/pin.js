
class Pin {
    static shuffle(o) {
        for (
          let j, x, i = o.length;
          i;
          j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
        );
        return o;
      }
    
      pingGen() {
        let digits = "123456789".split(""),
          first = Pin.shuffle(digits).pop();
        digits.push("0");
        return parseInt(first + Pin.shuffle(digits).join("").substring(0, 3), 10);
      }
}

module.exports = Pin