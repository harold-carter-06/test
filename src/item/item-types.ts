export enum ItemTypes {
    PRODUCT = "PRODUCT",
    SERVICE = "SERVICE"
}

export enum FieldTypes {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    IMAGES = 'IMAGES',
    CHECKBOX = 'CHECKBOX',
    RADIO_OPTIONS = "RADIO_OPTIONS",
    DROPDOWN = "DROPDOWN",
    DATE = "DATE",
    LARGE_TEXT = "LARGE_TEXT"
}

export interface ICustomFields {
    type: FieldTypes;
    prefillValue: string | string[];
    required: boolean;
    label: string;
    dropdown_options?: string[];
    radio_options?: string[];
  }