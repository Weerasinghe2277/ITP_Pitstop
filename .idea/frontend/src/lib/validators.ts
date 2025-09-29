// src/lib/validators.js
export const Enums = {
    ServiceType: ["inspection","repair","maintenance","bodywork","detailing"],
    BookingStatus: ["pending","inspecting","working","completed","cancelled"],
    JobStatus: ["pending","working","completed","cancelled","on_hold"],
    JobCategory: ["mechanical","electrical","bodywork","detailing","inspection","repair","maintenance"],
    Priority: ["low","medium","high","urgent"],
    InventoryCategory: ["parts","tools","fluids","consumables"],
    InventoryUnit: ["piece","liter","kg","meter","set"],
    FuelType: ["petrol","diesel","hybrid","electric"],
    Transmission: ["manual","automatic"],
    LeaveType: ["annual","sick","emergency","maternity","paternity","unpaid"],
    InvoiceStatus: ["draft","pending","paid","cancelled"],
    Roles: ["customer","technician","service_advisor","manager","admin","cashier"]
};
