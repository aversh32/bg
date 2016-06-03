/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */
;// Copyright by Ivan Kubota. 10/21/2015
module.exports = {
    getLower: function (seq, val, util) {
        if(Z.isArray(seq) && seq.length && seq[0].data)
            seq = seq.map(function (el) {
              return parseFloat(el.data);
            });

        console.log('getLower', val,seq[1],seq[0],seq[1]<seq[0] && seq[1]<val && seq[0]>=val);
        util.ok(seq[1]<seq[0] && seq[1]<val && seq[0]>=val);
        return util.wait;
    }
};
