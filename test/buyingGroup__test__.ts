import * as test from "tape";
import * as buyingGroup from '../src/buyingGroup';

const orderData = [

];

test("createInvoiceData", (t) => {
    const result = buyingGroup.createInvoiceData(orderData);
    t.deepEqual(result, orderData);
    t.end();

  });