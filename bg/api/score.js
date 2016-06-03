/**
 * Created by Ivan on 7/24/2015.
 */
var interfaces = {};
Z.include('./js/interface/score/', function( ifaces ){
    interfaces = ifaces;
});
module.exports = {
    person: function (pid, person, detail) {
        /*
        Метод получает на вход данные
        #in#
            pid: project-id - id проекта
            detail: bool - Детализированный отчёт
            template: string - шаблон проверки. Варианты: 'auto insurance', 'credit', 'life insurance', 'employee'. В зависимости от шаблона изменяются веса негативных\позитивных факторов.
            person:
                name: string - Имя
                surname: string - Фамилия
                middlename: string - Отчество
                inn: number{12} - ИНН. 12 цифр
                [ogrnip]: number{15} - ОГРНИП. 15 цифр
                birth: Object
                    date: timestamp - дата рождения
                    place: string - место рождения
                region: string - код субъекта РФ
                address: Array of objects
                    region: string - код субъекта РФ
                    state: string - район
                    city: string - город
                    street: string - улица
                    house: string - номер дома
                    building: string - строение
                    flat: string - квартира
                passport: Object
                    series: number - серия паспорта
                    number: number - номер пасспорта
                    date: timestamp - дата выдачи паспорта
                    foreign: bool - true для загранпаспорта
                phone: number - телефон
                [company]: Object
                    name: string - название компании
                    inn: number - ИНН юридического лица 12 цифр
                    ogrn: number{13} - ОГРН
                    type: string - организационно-правовая форма компании (например 'ООО')
                    address: Object
                        city: string - город
                        street: string - улица
                        house: string - номер дома
        #out#
            #ok
                #js
                    {
                        score: [0-100] // степень доверия
                        detail: [ // если флаг detail установлен в true
                            {code: description}
                        ]
                    }
        #can user score.person in project: pid
         */
        interfaces.scoringlabs.person(person, function (data) {
            util.ok(data);
        });
    }
};