import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

/**
 * Currency Module - manage system currencies (ETB default, USD option,
 * admin-addable). Exposes the currency list so other modules can reference it.
 */
@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}