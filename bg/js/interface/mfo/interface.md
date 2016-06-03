MFO.


# methods
    this = mfo. for custom

    balance(id, pass, cb) -> {currency_code: {balance:amount, overdraft: overdraft}} || false
    info(id, pass, currencyFrom,
        to, type, currencyTo,
        amount,
        cb) -> {amount, full, fix, parcent, min, max} || false
    transaction(
        id, pass, currencyFrom,
        to, type, currencyTo,
        amount,
        cb) -> {gateId, status}+info || false
    status(id, pass, tid, cb) -> {status} || false


# status
    1 in queue
    10 success
    >19 fail