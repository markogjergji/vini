import type { Seller } from "../../types";

interface Props {
  seller: Seller;
}

export default function SellerInfo({ seller }: Props) {
  return (
    <div>
      <div className="text-sm font-medium">
        {seller.business_name ?? seller.name}
        {seller.is_business && (
          <span className="text-gray-400 ml-1">(Business)</span>
        )}
      </div>
      {seller.phone && (
        <div className="text-sm text-gray-600 mt-1">
          Tel: {seller.phone}
        </div>
      )}
      {seller.address && (
        <div className="text-sm text-gray-600 mt-1">
          {seller.address}{seller.city ? `, ${seller.city}` : ""}
        </div>
      )}
      {seller.email && (
        <div className="text-sm text-gray-600 mt-1">{seller.email}</div>
      )}
    </div>
  );
}
