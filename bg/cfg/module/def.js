/**
 * Created by Ivan on 6/2/2015.
 */
module.exports = {
    table: {
        zone: {
            //recreate: true,
            name: 'zone',
            fields: {
                to: {type: 'varchar(64)'},
                from: {type: 'varchar(64)'}
            }/*,
            init: [
                {to: 'Зона 1', from: 'Albania'},
                {to: 'Зона 1', from: 'Algeria'},
                {to: 'Зона 1', from: 'Zambia'},
                {to: 'Зона 2', from: 'Algeria'},
                {to: 'Зона 2', from: 'Zambia'},
                {to: 'Зона 2', from: 'сот.связь'}
            ]*/
        }
    }
};