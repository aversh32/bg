/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */
;// Copyright by Ivan Kubota. 11/6/2015

module.exports = {
    collapse: function (seq, util) {
        console.log('in collapse', JSON.stringify(seq));
        return util.wait;
    },
    counter: function (seq, util) {
        util.ok(seq.length);
        return util.wait;
    }
};