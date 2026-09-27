import type * as runtime from "@prisma/client/runtime/client";
import * as $Enums from "./enums.js";
import type * as Prisma from "./internal/prismaNamespace.js";
export type IntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type StringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
};
export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type SortOrderInput = {
    sort: Prisma.SortOrder;
    nulls?: Prisma.NullsOrder;
};
export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
};
export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type JsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
};
export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type Enumbookings_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.bookings_status_enum | Prisma.Enumbookings_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel> | $Enums.bookings_status_enum;
};
export type DecimalFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type Enumbookings_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.bookings_status_enum | Prisma.Enumbookings_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumbookings_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.bookings_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel>;
};
export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalFilter<$PrismaModel>;
};
export type Enumcomplaints_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_type_enum | Prisma.Enumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel> | $Enums.complaints_type_enum;
};
export type Enumcomplaints_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_status_enum | Prisma.Enumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel> | $Enums.complaints_status_enum;
};
export type Enumcomplaints_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_type_enum | Prisma.Enumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.complaints_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel>;
};
export type Enumcomplaints_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_status_enum | Prisma.Enumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.complaints_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_detergent_preference_enum | Prisma.Enumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_detergent_preference_enum;
};
export type Enumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_water_temperature_preference_enum | Prisma.Enumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_water_temperature_preference_enum;
};
export type Enumcustomer_profiles_fold_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_fold_preference_enum | Prisma.Enumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_fold_preference_enum;
};
export type Enumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_notification_channel_preference_enum | Prisma.Enumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_notification_channel_preference_enum;
};
export type Enumcustomer_profiles_membership_tier_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_membership_tier_enum | Prisma.Enumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel> | $Enums.customer_profiles_membership_tier_enum;
};
export type Enumcustomer_profiles_gender_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_gender_enum | Prisma.Enumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    in?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    notIn?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    not?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel> | $Enums.customer_profiles_gender_enum | null;
};
export type Enumcustomer_profiles_detergent_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_detergent_preference_enum | Prisma.Enumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_detergent_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_water_temperature_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_water_temperature_preference_enum | Prisma.Enumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_water_temperature_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_fold_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_fold_preference_enum | Prisma.Enumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_fold_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_notification_channel_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_notification_channel_preference_enum | Prisma.Enumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_notification_channel_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_membership_tier_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_membership_tier_enum | Prisma.Enumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_membership_tier_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel>;
};
export type Enumcustomer_profiles_gender_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_gender_enum | Prisma.Enumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    in?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    notIn?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    not?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_gender_enum | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel>;
};
export type Enumdelivery_trips_trip_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_trip_type_enum | Prisma.Enumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel> | $Enums.delivery_trips_trip_type_enum;
};
export type Enumdelivery_trips_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_status_enum | Prisma.Enumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel> | $Enums.delivery_trips_status_enum;
};
export type Enumdelivery_trips_trip_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_trip_type_enum | Prisma.Enumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_trip_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.delivery_trips_trip_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel>;
};
export type Enumdelivery_trips_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_status_enum | Prisma.Enumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.delivery_trips_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel>;
};
export type Enumlaundry_stores_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.laundry_stores_status_enum | Prisma.Enumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel> | $Enums.laundry_stores_status_enum;
};
export type Enumlaundry_stores_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.laundry_stores_status_enum | Prisma.Enumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumlaundry_stores_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.laundry_stores_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel>;
};
export type Enummachines_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_type_enum | Prisma.Enummachines_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel> | $Enums.machines_type_enum;
};
export type Enummachines_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_status_enum | Prisma.Enummachines_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel> | $Enums.machines_status_enum;
};
export type Enummachines_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_type_enum | Prisma.Enummachines_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.machines_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel>;
};
export type Enummachines_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_status_enum | Prisma.Enummachines_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.machines_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel>;
};
export type Enumnotifications_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_type_enum | Prisma.Enumnotifications_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel> | $Enums.notifications_type_enum;
};
export type Enumnotifications_channel_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_channel_enum | Prisma.Enumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel> | $Enums.notifications_channel_enum;
};
export type Enumnotifications_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_type_enum | Prisma.Enumnotifications_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.notifications_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel>;
};
export type Enumnotifications_channel_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_channel_enum | Prisma.Enumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_channel_enumWithAggregatesFilter<$PrismaModel> | $Enums.notifications_channel_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel>;
};
export type Enumpayments_payment_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_payment_type_enum | Prisma.Enumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel> | $Enums.payments_payment_type_enum;
};
export type Enumpayments_method_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_method_enum | Prisma.Enumpayments_method_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel> | $Enums.payments_method_enum;
};
export type Enumpayments_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_status_enum | Prisma.Enumpayments_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel> | $Enums.payments_status_enum;
};
export type Enumpayments_payment_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_payment_type_enum | Prisma.Enumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_payment_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_payment_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel>;
};
export type Enumpayments_method_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_method_enum | Prisma.Enumpayments_method_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_method_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_method_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel>;
};
export type Enumpayments_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_status_enum | Prisma.Enumpayments_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel>;
};
export type Enumpromotions_discount_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_discount_type_enum | Prisma.Enumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel> | $Enums.promotions_discount_type_enum;
};
export type Enumpromotions_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_status_enum | Prisma.Enumpromotions_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel> | $Enums.promotions_status_enum;
};
export type Enumpromotions_discount_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_discount_type_enum | Prisma.Enumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_discount_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.promotions_discount_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel>;
};
export type Enumpromotions_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_status_enum | Prisma.Enumpromotions_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.promotions_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel>;
};
export type Enumservices_pricing_unit_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.services_pricing_unit_enum | Prisma.Enumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel> | $Enums.services_pricing_unit_enum;
};
export type Enumservices_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.services_status_enum | Prisma.Enumservices_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel> | $Enums.services_status_enum;
};
export type Enumservices_pricing_unit_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.services_pricing_unit_enum | Prisma.Enumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_pricing_unit_enumWithAggregatesFilter<$PrismaModel> | $Enums.services_pricing_unit_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel>;
};
export type Enumservices_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.services_status_enum | Prisma.Enumservices_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.services_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel>;
};
export type Enumusers_role_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.users_role_enum | Prisma.Enumusers_role_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel> | $Enums.users_role_enum;
};
export type Enumusers_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.users_status_enum | Prisma.Enumusers_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel> | $Enums.users_status_enum;
};
export type Enumusers_role_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.users_role_enum | Prisma.Enumusers_role_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_role_enumWithAggregatesFilter<$PrismaModel> | $Enums.users_role_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel>;
};
export type Enumusers_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.users_status_enum | Prisma.Enumusers_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.users_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel>;
};
export type Enumwaitlist_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.waitlist_status_enum | Prisma.Enumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel> | $Enums.waitlist_status_enum;
};
export type Enumwaitlist_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.waitlist_status_enum | Prisma.Enumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumwaitlist_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.waitlist_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel>;
};
export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
};
export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatFilter<$PrismaModel> | number;
};
export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
};
export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null;
};
export type NestedJsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<NestedJsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type NestedEnumbookings_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.bookings_status_enum | Prisma.Enumbookings_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel> | $Enums.bookings_status_enum;
};
export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type NestedEnumbookings_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.bookings_status_enum | Prisma.Enumbookings_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.bookings_status_enum[] | Prisma.ListEnumbookings_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumbookings_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.bookings_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumbookings_status_enumFilter<$PrismaModel>;
};
export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalFilter<$PrismaModel>;
};
export type NestedEnumcomplaints_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_type_enum | Prisma.Enumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel> | $Enums.complaints_type_enum;
};
export type NestedEnumcomplaints_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_status_enum | Prisma.Enumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel> | $Enums.complaints_status_enum;
};
export type NestedEnumcomplaints_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_type_enum | Prisma.Enumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_type_enum[] | Prisma.ListEnumcomplaints_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.complaints_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcomplaints_type_enumFilter<$PrismaModel>;
};
export type NestedEnumcomplaints_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.complaints_status_enum | Prisma.Enumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.complaints_status_enum[] | Prisma.ListEnumcomplaints_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcomplaints_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.complaints_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcomplaints_status_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_detergent_preference_enum | Prisma.Enumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_detergent_preference_enum;
};
export type NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_water_temperature_preference_enum | Prisma.Enumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_water_temperature_preference_enum;
};
export type NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_fold_preference_enum | Prisma.Enumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_fold_preference_enum;
};
export type NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_notification_channel_preference_enum | Prisma.Enumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel> | $Enums.customer_profiles_notification_channel_preference_enum;
};
export type NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_membership_tier_enum | Prisma.Enumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel> | $Enums.customer_profiles_membership_tier_enum;
};
export type NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_gender_enum | Prisma.Enumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    in?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    notIn?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    not?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel> | $Enums.customer_profiles_gender_enum | null;
};
export type NestedEnumcustomer_profiles_detergent_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_detergent_preference_enum | Prisma.Enumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_detergent_preference_enum[] | Prisma.ListEnumcustomer_profiles_detergent_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_detergent_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_detergent_preference_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_water_temperature_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_water_temperature_preference_enum | Prisma.Enumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_water_temperature_preference_enum[] | Prisma.ListEnumcustomer_profiles_water_temperature_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_water_temperature_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_water_temperature_preference_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_fold_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_fold_preference_enum | Prisma.Enumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_fold_preference_enum[] | Prisma.ListEnumcustomer_profiles_fold_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_fold_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_fold_preference_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_notification_channel_preference_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_notification_channel_preference_enum | Prisma.Enumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_notification_channel_preference_enum[] | Prisma.ListEnumcustomer_profiles_notification_channel_preference_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_notification_channel_preference_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_notification_channel_preference_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_membership_tier_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_membership_tier_enum | Prisma.Enumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.customer_profiles_membership_tier_enum[] | Prisma.ListEnumcustomer_profiles_membership_tier_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_membership_tier_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_membership_tier_enumFilter<$PrismaModel>;
};
export type NestedEnumcustomer_profiles_gender_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.customer_profiles_gender_enum | Prisma.Enumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    in?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    notIn?: $Enums.customer_profiles_gender_enum[] | Prisma.ListEnumcustomer_profiles_gender_enumFieldRefInput<$PrismaModel> | null;
    not?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.customer_profiles_gender_enum | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumcustomer_profiles_gender_enumNullableFilter<$PrismaModel>;
};
export type NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_trip_type_enum | Prisma.Enumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel> | $Enums.delivery_trips_trip_type_enum;
};
export type NestedEnumdelivery_trips_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_status_enum | Prisma.Enumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel> | $Enums.delivery_trips_status_enum;
};
export type NestedEnumdelivery_trips_trip_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_trip_type_enum | Prisma.Enumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_trip_type_enum[] | Prisma.ListEnumdelivery_trips_trip_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_trip_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.delivery_trips_trip_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumdelivery_trips_trip_type_enumFilter<$PrismaModel>;
};
export type NestedEnumdelivery_trips_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.delivery_trips_status_enum | Prisma.Enumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.delivery_trips_status_enum[] | Prisma.ListEnumdelivery_trips_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumdelivery_trips_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.delivery_trips_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumdelivery_trips_status_enumFilter<$PrismaModel>;
};
export type NestedEnumlaundry_stores_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.laundry_stores_status_enum | Prisma.Enumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel> | $Enums.laundry_stores_status_enum;
};
export type NestedEnumlaundry_stores_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.laundry_stores_status_enum | Prisma.Enumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.laundry_stores_status_enum[] | Prisma.ListEnumlaundry_stores_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumlaundry_stores_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.laundry_stores_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumlaundry_stores_status_enumFilter<$PrismaModel>;
};
export type NestedEnummachines_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_type_enum | Prisma.Enummachines_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel> | $Enums.machines_type_enum;
};
export type NestedEnummachines_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_status_enum | Prisma.Enummachines_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel> | $Enums.machines_status_enum;
};
export type NestedEnummachines_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_type_enum | Prisma.Enummachines_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_type_enum[] | Prisma.ListEnummachines_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.machines_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnummachines_type_enumFilter<$PrismaModel>;
};
export type NestedEnummachines_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.machines_status_enum | Prisma.Enummachines_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.machines_status_enum[] | Prisma.ListEnummachines_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnummachines_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.machines_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnummachines_status_enumFilter<$PrismaModel>;
};
export type NestedEnumnotifications_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_type_enum | Prisma.Enumnotifications_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel> | $Enums.notifications_type_enum;
};
export type NestedEnumnotifications_channel_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_channel_enum | Prisma.Enumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel> | $Enums.notifications_channel_enum;
};
export type NestedEnumnotifications_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_type_enum | Prisma.Enumnotifications_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_type_enum[] | Prisma.ListEnumnotifications_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.notifications_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumnotifications_type_enumFilter<$PrismaModel>;
};
export type NestedEnumnotifications_channel_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.notifications_channel_enum | Prisma.Enumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.notifications_channel_enum[] | Prisma.ListEnumnotifications_channel_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumnotifications_channel_enumWithAggregatesFilter<$PrismaModel> | $Enums.notifications_channel_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumnotifications_channel_enumFilter<$PrismaModel>;
};
export type NestedEnumpayments_payment_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_payment_type_enum | Prisma.Enumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel> | $Enums.payments_payment_type_enum;
};
export type NestedEnumpayments_method_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_method_enum | Prisma.Enumpayments_method_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel> | $Enums.payments_method_enum;
};
export type NestedEnumpayments_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_status_enum | Prisma.Enumpayments_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel> | $Enums.payments_status_enum;
};
export type NestedEnumpayments_payment_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_payment_type_enum | Prisma.Enumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_payment_type_enum[] | Prisma.ListEnumpayments_payment_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_payment_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_payment_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_payment_type_enumFilter<$PrismaModel>;
};
export type NestedEnumpayments_method_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_method_enum | Prisma.Enumpayments_method_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_method_enum[] | Prisma.ListEnumpayments_method_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_method_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_method_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_method_enumFilter<$PrismaModel>;
};
export type NestedEnumpayments_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.payments_status_enum | Prisma.Enumpayments_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.payments_status_enum[] | Prisma.ListEnumpayments_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpayments_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.payments_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpayments_status_enumFilter<$PrismaModel>;
};
export type NestedEnumpromotions_discount_type_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_discount_type_enum | Prisma.Enumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel> | $Enums.promotions_discount_type_enum;
};
export type NestedEnumpromotions_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_status_enum | Prisma.Enumpromotions_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel> | $Enums.promotions_status_enum;
};
export type NestedEnumpromotions_discount_type_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_discount_type_enum | Prisma.Enumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_discount_type_enum[] | Prisma.ListEnumpromotions_discount_type_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_discount_type_enumWithAggregatesFilter<$PrismaModel> | $Enums.promotions_discount_type_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpromotions_discount_type_enumFilter<$PrismaModel>;
};
export type NestedEnumpromotions_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.promotions_status_enum | Prisma.Enumpromotions_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.promotions_status_enum[] | Prisma.ListEnumpromotions_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumpromotions_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.promotions_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumpromotions_status_enumFilter<$PrismaModel>;
};
export type NestedEnumservices_pricing_unit_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.services_pricing_unit_enum | Prisma.Enumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel> | $Enums.services_pricing_unit_enum;
};
export type NestedEnumservices_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.services_status_enum | Prisma.Enumservices_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel> | $Enums.services_status_enum;
};
export type NestedEnumservices_pricing_unit_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.services_pricing_unit_enum | Prisma.Enumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_pricing_unit_enum[] | Prisma.ListEnumservices_pricing_unit_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_pricing_unit_enumWithAggregatesFilter<$PrismaModel> | $Enums.services_pricing_unit_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumservices_pricing_unit_enumFilter<$PrismaModel>;
};
export type NestedEnumservices_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.services_status_enum | Prisma.Enumservices_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.services_status_enum[] | Prisma.ListEnumservices_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumservices_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.services_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumservices_status_enumFilter<$PrismaModel>;
};
export type NestedEnumusers_role_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.users_role_enum | Prisma.Enumusers_role_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel> | $Enums.users_role_enum;
};
export type NestedEnumusers_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.users_status_enum | Prisma.Enumusers_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel> | $Enums.users_status_enum;
};
export type NestedEnumusers_role_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.users_role_enum | Prisma.Enumusers_role_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_role_enum[] | Prisma.ListEnumusers_role_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_role_enumWithAggregatesFilter<$PrismaModel> | $Enums.users_role_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumusers_role_enumFilter<$PrismaModel>;
};
export type NestedEnumusers_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.users_status_enum | Prisma.Enumusers_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.users_status_enum[] | Prisma.ListEnumusers_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumusers_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.users_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumusers_status_enumFilter<$PrismaModel>;
};
export type NestedEnumwaitlist_status_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.waitlist_status_enum | Prisma.Enumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel> | $Enums.waitlist_status_enum;
};
export type NestedEnumwaitlist_status_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.waitlist_status_enum | Prisma.Enumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    in?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    notIn?: $Enums.waitlist_status_enum[] | Prisma.ListEnumwaitlist_status_enumFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumwaitlist_status_enumWithAggregatesFilter<$PrismaModel> | $Enums.waitlist_status_enum;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumwaitlist_status_enumFilter<$PrismaModel>;
};
