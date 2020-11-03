import { AssetTransferRequest } from '../models/request.objects/asset-transfer-request';
import { NewAssetRequest } from '../models/request.objects/new-asset-request';
import { AssetsService } from '../services/assets.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Asset } from 'src/models/asset.model';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('/assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService){}
    
    @Get()
    @Roles('all')
    getAllAssets(): Promise<Asset[]> {
        return this.assetsService.getAssets();
    }

    @Post()
    @Roles('all')
    createNewAsset(@Body() asset: NewAssetRequest): Promise<Asset> {
        return this.assetsService.createAsset(asset);
    }

    @Post('/transfer')
    @Roles('all')
    transferAssset(@Body() assetTranfer: AssetTransferRequest): Promise<Asset> {
        return this.assetsService.transferAsset(assetTranfer);
    }
}
