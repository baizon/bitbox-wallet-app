import { useNavigate } from 'react-router-dom';
import { useLoad } from '@/hooks/api';
import * as exchangesAPI from '@/api/exchanges';
import { useContext, useEffect, useState } from 'react';
import { ExchangeSelectionRadio } from './exchangeselectionradio';
import { Button } from '@/components/forms/button';
import { useTranslation } from 'react-i18next';
import { getVersion } from '@/api/bitbox02';
import style from '../exchange.module.css';
import { AppContext } from '@/contexts/AppContext';
import { TInfoContentProps } from './infocontent';
import { Skeleton } from '@/components/skeleton/skeleton';

type TProps = {
  accountCode: string;
  deviceIDs: string[];
  selectedRegion: string;
  onSelectExchange: (exchange: string) => void;
  selectedExchange: string;
  goToExchange: () => void;
  showBackButton: boolean;
  action: exchangesAPI.TExchangeAction
  setInfo: (into: TInfoContentProps) => void;
}

export const BuySell = ({
  accountCode,
  deviceIDs,
  selectedRegion,
  onSelectExchange,
  selectedExchange,
  goToExchange,
  showBackButton,
  action,
  setInfo,
}: TProps) => {
  const { t } = useTranslation();
  const { setFirmwareUpdateDialogOpen } = useContext(AppContext);

  const exchangeDealsResponse = useLoad(() => exchangesAPI.getExchangeDeals(action, accountCode, selectedRegion), [action, selectedRegion]);
  const [updateFirmwareToSell, setUpdateFirmwareToSell] = useState(false);
  // FIXME: we should make a BE `can-sell` endpoint
  const versionInfo = useLoad(() => getVersion(deviceIDs[0]), [deviceIDs[0]]);
  const navigate = useNavigate();

  // checks if the device needs a firmware upgrade to enable the sell feature.
  useEffect(() => {
    if (action === 'sell' && (!versionInfo || (versionInfo && versionInfo.canUpgrade))) {
      setUpdateFirmwareToSell(true);
    } else {
      setUpdateFirmwareToSell(false);
    }
  }, [action, versionInfo]);

  // checks for the loaded exchange deals, and preselect if there is only one available.
  useEffect(() => {
    if (exchangeDealsResponse?.success && exchangeDealsResponse.exchanges.length === 1) {
      onSelectExchange(exchangeDealsResponse.exchanges[0].exchangeName);
    } else {
      onSelectExchange('');
    }
  }, [exchangeDealsResponse, onSelectExchange]);

  const constructErrorMessage = (action: exchangesAPI.TExchangeAction): string | undefined => {
    if (updateFirmwareToSell) {
      return t('exchange.buySell.updateFirmware');
    } else if (exchangeDealsResponse?.success === false) {
      if (exchangeDealsResponse.errorCode) {
        return t('exchange.buySell.' + exchangeDealsResponse.errorCode, { action });
      }
      return exchangeDealsResponse.errorMessage;
    }
  };

  const buildInfo = (exchange: exchangesAPI.ExchangeDeals): TInfoContentProps => {
    const cardFee = exchange.deals && exchange.deals.find(feeDetail => feeDetail.payment === 'card')?.fee;
    const bankTransferFee = exchange.deals && exchange.deals.find(feeDetail => feeDetail.payment === 'bank-transfer')?.fee;
    return { info: exchange.exchangeName, cardFee, bankTransferFee };
  };

  return (
    <>
      <div className={style.innerRadioButtonsContainer}>
        {!exchangeDealsResponse && <Skeleton/> }
        {exchangeDealsResponse?.success === false || updateFirmwareToSell ? (
          <div className="flex flex-column">
            <p className={style.noExchangeText}>{constructErrorMessage(action)}</p>
            {updateFirmwareToSell &&
              <Button
                className={style.updateButton}
                onClick={() => {
                  setFirmwareUpdateDialogOpen(true);
                  navigate(`/settings/device-settings/${deviceIDs[0]}`);
                }}
                transparent>
                {t('exchange.buySell.updateNow')}
              </Button>
            }
          </div>
        ) : (
          <div>
            {exchangeDealsResponse?.exchanges.map(exchange => (
              <ExchangeSelectionRadio
                key={exchange.exchangeName}
                id={exchange.exchangeName}
                exchangeName={exchange.exchangeName}
                deals={exchange.deals}
                checked={selectedExchange === exchange.exchangeName}
                onChange={() => {
                  onSelectExchange(exchange.exchangeName);
                }}
                onClickInfoButton={() => setInfo(buildInfo(exchange))}
              />
            ))}
          </div>
        )}
      </div>
      {exchangeDealsResponse?.success &&
          <div className={style.buttonsContainer}>
            {showBackButton && (
              <Button
                className={style.buttonBack}
                secondary
                onClick={() => navigate('/exchange/info')}>
                {t('button.back')}
              </Button>
            )
            }
            <Button
              primary
              disabled={!selectedExchange}
              onClick={goToExchange} >
              {t('button.next')}
            </Button>
          </div>
      }
    </>
  );
};
