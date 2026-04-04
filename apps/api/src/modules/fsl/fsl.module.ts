import { Module } from '@nestjs/common';
import { FSLService } from './fsl.service';
import { FSLController } from './fsl.controller';

@Module({
  providers: [FSLService],
  controllers: [FSLController],
  exports: [FSLService],
})
export class FSLModule {}
