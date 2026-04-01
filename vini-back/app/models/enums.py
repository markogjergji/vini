from enum import Enum


class PartCondition(str, Enum):
    used = "used"
    refurbished = "refurbished"
    new_old_stock = "new_old_stock"


class ListingStatus(str, Enum):
    active = "active"
    sold = "sold"
    reserved = "reserved"
    expired = "expired"
