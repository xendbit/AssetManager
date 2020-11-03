import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
export class AssetTransferRequest {
    @IsNotEmpty()
    @ApiProperty()
    public assetName: string;
    @IsNotEmpty()
    @ApiProperty()
    public assetIssuerId: number;
    @IsNotEmpty()
    @ApiProperty()
    public senderId: number;
    @IsNotEmpty()
    @ApiProperty()
    public recipientId: number;
    @IsNumber()
    @ApiProperty()
    public quantity: number;
}
