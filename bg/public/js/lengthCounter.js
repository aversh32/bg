(function(){
    var charset7bit = {'@': 1, '£': 1, '$': 1, '¥': 1, 'è': 1, 'é': 1, 'ù': 1, 'ì': 1, 'ò': 1, 'Ç': 1, "\n":1, 'Ø': 1, 'ø': 1, "\r":1, 'Å': 1, 'å': 1, 'Δ': 1, '_': 1, 'Φ': 1, 'Γ': 1, 'Λ': 1, 'Ω': 1, 'Π': 1, 'Ψ': 1, 'Σ': 1, 'Θ': 1, 'Ξ': 1, 'Æ': 1, 'æ': 1, 'ß': 1, 'É': 1, ' ': 1, '!': 1, '"': 1, '#': 1, '¤': 1, '%': 1, '&': 1, "'":1, '(': 1, ')': 1, '*': 1, '+': 1, ',': 1, '-': 1, '.': 1, '/': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, ':': 1, ';': 1, '<': 1, '=': 1, '>': 1, '?': 1, '¡': 1, 'A': 1, 'B': 1, 'C': 1, 'D': 1, 'E': 1, 'F': 1, 'G': 1, 'H': 1, 'I': 1, 'J': 1, 'K': 1, 'L': 1, 'M': 1, 'N': 1, 'O': 1, 'P': 1, 'Q': 1, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 1, 'W': 1, 'X': 1, 'Y': 1, 'Z': 1, 'Ä': 1, 'Ö': 1, 'Ñ': 1, 'Ü': 1, '§': 1, '¿': 1, 'a': 1, 'b': 1, 'c': 1, 'd': 1, 'e': 1, 'f': 1, 'g': 1, 'h': 1, 'i': 1, 'j': 1, 'k': 1, 'l': 1, 'm': 1, 'n': 1, 'o': 1, 'p': 1, 'q': 1, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 1, 'w': 1, 'x': 1, 'y': 1, 'z': 1, 'ä': 1, 'ö': 1, 'ñ': 1, 'ü': 1, 'à': 1, "\f": 2, '^': 2, '{': 2, '}': 2, '\\': 2, '[': 2, '~': 2, ']': 2, '|': 2, '€': 2};
    ;
    var replace = {
        'õ': 'ò',
        'Õ': 'ò',
        '–': '-',
        '„': '"',
        '“': '"',
        '´': "'",
        '`': "'"
    };

    var scope = Function('return this')() || (13, eval)('this');
    scope.smsLength = function( content ) {

        var use_7bit = true;
        var length_7bit = 0;
        var length_16bit = 0;
        var char,
            val;

        for (var i = 0, _i = content.length; i < _i; i++) {
            char = content.charAt(i);

            if (use_7bit && !(char in charset7bit) && ! (char in replace) ) {
                use_7bit = false;
            }

            if (use_7bit) {

                if (val = replace[char]) {
                    length_7bit += charset7bit[val];
                } else {
                    length_7bit += charset7bit[char];
                }
            }else{
                length_16bit += _i - i;
                break;
            }

            length_16bit++;
        }
        var chars = use_7bit ? length_7bit : length_16bit;
        var sms_count;

        if (use_7bit && chars <= 160) {
            return [ chars === 0 ? 0 : 1, 160 - chars, use_7bit ];
        }

        if (!use_7bit && chars <= 70) {
            return [ 1, 70 - chars, use_7bit ];
        }

        var coeff = use_7bit ? 153 : 67;
        sms_count = Math.ceil(chars / coeff);

        return [ sms_count, (sms_count * coeff) - chars, use_7bit ];

    };

})();