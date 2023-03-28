type CaseStr = "int32" | "bigdecimal" | "bigint" | "string" | "bytes" | "bool" | "array";
type Case = Number | bigint | string | boolean | Array<any>;

enum Operation {
    UNSET,
    CREATE,
    UPDATE,
    DELETE,
}

export interface Value {
    typed: {
        case: CaseStr;
        value: Case;
    }
}

export interface Field {
    name: string;
    newValue: Value;
}

export interface EntityChange {
    entity: string;
    id: string;
    ordinal: bigint;
    operation: Operation;
    fields: Array<Field>;
}