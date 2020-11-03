import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from "class-validator";

export class NewAssetRequest {
    @IsNotEmpty()
    @ApiProperty()
    public name: string;
    @IsNotEmpty()
    @ApiProperty()
    public description: string;
    @IsNumber()
    @ApiProperty()
    public totalQuantity: number;
    @IsNumber()
    @ApiProperty()
    public decimal: number;
    @IsNotEmpty()
    @ApiProperty()
    public issuerId: number;;
}