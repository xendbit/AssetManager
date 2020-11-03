import { ApiProperty } from "@nestjs/swagger";

export class Asset {
    @ApiProperty()
    public id: number;
    @ApiProperty()
    public name: string;
    @ApiProperty()
    public description: string;
    @ApiProperty()
    public totalQuantity: number;
    @ApiProperty()
    public quantity: number;
    @ApiProperty()
    public decimal: number;
    @ApiProperty()
    public issuer: string;
    @ApiProperty()
    public owner: string;     

    public static assetFromResponse(res): Asset {
        const asset: Asset = {
            id: res.id,
            name: res.name,
            description: res.description,
            totalQuantity: res.totalQuantity,
            quantity: res.quantity,
            decimal: res.decimal,
            issuer: res.issuer,
            owner: res.owner
        }
        
        return asset;
    }
}
