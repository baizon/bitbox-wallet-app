/**
 * Copyright 2024 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useLoad } from '@/hooks/api';
import * as exchangesAPI from '@/api/exchanges';
import { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/forms/button';
import { useTranslation } from 'react-i18next';
import { AppContext } from '@/contexts/AppContext';
import { TInfoContentProps } from './infocontent';
import { Skeleton } from '@/components/skeleton/skeleton';
import { hasPaymentRequest } from '@/api/account';
import { Message } from '@/components/message/message';
import { ExternalLinkWhite, ExternalLinkBlack, Businessman } from '@/components/icon';
import { useDarkmode } from '@/hooks/darkmode';
import { i18n } from '@/i18n/i18n';
import { A } from '@/components/anchor/anchor';
import { InfoButton } from '@/components/infobutton/infobutton';
import { getConfig } from '@/utils/config';
import { ActionableItem } from '@/components/actionable-item/actionable-item';
import { ExchangeProviders } from '@/routes/exchange/components/exchange-providers';
import style from '../exchange.module.css';

type TProps = {
  accountCode: string;
  deviceIDs: string[];
  selectedRegion: string;
  goToExchange: (exchange: string) => void;
  showBackButton: boolean;
  action: exchangesAPI.TExchangeAction
  setInfo: (into: TInfoContentProps) => void;
}

export const getBTCDirectLink = () => {
  switch (i18n.resolvedLanguage) {
  case 'de':
    return 'https://btcdirect.eu/de-at/private-trading-contact?BitBox';
  case 'nl':
    return 'https://btcdirect.eu/nl-nl/private-trading-contact?BitBox';
  case 'es':
    return 'https://btcdirect.eu/es-es/private-trading-contactanos?BitBox';
  case 'fr':
    return 'https://btcdirect.eu/fr-fr/private-trading-contact?BitBox';
  default:
    return 'https://btcdirect.eu/en-eu/private-trading-contact?BitBox';
  }
};

export const BuySell = ({
  accountCode,
  deviceIDs,
  selectedRegion,
  goToExchange,
  showBackButton,
  action,
  setInfo,
}: TProps) => {
  const { t } = useTranslation();
  const { setFirmwareUpdateDialogOpen } = useContext(AppContext);
  const { isDarkMode } = useDarkmode();

  const exchangeDealsResponse = useLoad(() => exchangesAPI.getExchangeDeals(action, accountCode, selectedRegion), [action, selectedRegion]);
  const btcDirectSupported = useLoad(exchangesAPI.getBtcDirectSupported(accountCode, selectedRegion), [selectedRegion]);
  const hasPaymentRequestResponse = useLoad(() => hasPaymentRequest(accountCode));
  const [paymentRequestError, setPaymentRequestError] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const config = useLoad(getConfig);
  const navigate = useNavigate();

  // enable paymentRequestError only when the action is sell.
  useEffect(() => {
    setPaymentRequestError(action === 'sell' && hasPaymentRequestResponse?.success === false);
  }, [hasPaymentRequestResponse, action]);


  useEffect(() => {
    if (config) {
      setAgreedTerms(config.frontend.skipBTCDirectDisclaimer);
    }
  }, [config]);

  const constructErrorMessage = (): string | undefined => {
    if (exchangeDealsResponse?.success === false) {
      if (exchangeDealsResponse.errorCode) {
        return t('exchange.buySell.' + exchangeDealsResponse.errorCode);
      }
      return exchangeDealsResponse.errorMessage;
    } else if (paymentRequestError) {
      if (hasPaymentRequestResponse?.errorCode) {
        return t('device.' + hasPaymentRequestResponse.errorCode);
      } else {
        return hasPaymentRequestResponse?.errorMessage || '';
      }
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
        {!exchangeDealsResponse && <Skeleton />}
        {exchangeDealsResponse?.success === false || paymentRequestError ? (
          <div className="flex flex-column">
            <p className={style.noExchangeText}>{constructErrorMessage()}</p>
            {exchangeDealsResponse?.success &&
              paymentRequestError &&
              hasPaymentRequestResponse?.errorCode === 'firmwareUpgradeRequired' && (
              <Button
                className={style.updateButton}
                onClick={() => {
                  setFirmwareUpdateDialogOpen(true);
                  navigate(`/settings/device-settings/${deviceIDs[0]}`);
                }}
                transparent>
                {t('exchange.buySell.updateNow')}
              </Button>
            )}
          </div>
        ) : (
          <div className={style.exchangeProvidersContainer}>
            {exchangeDealsResponse?.exchanges.map(exchange => (
              <div key={exchange.exchangeName} className={style.actionableItemContainer}>
                <ActionableItem
                  key={exchange.exchangeName}
                  onClick={() => {
                    goToExchange(exchange.exchangeName);
                  }}>
                  <ExchangeProviders
                    deals={exchange.deals}
                    exchangeName={exchange.exchangeName}
                  />
                </ActionableItem>

                <InfoButton onClick={() => setInfo(buildInfo(exchange))} />
              </div>
            ))}
          </div>
        )}
        {btcDirectSupported?.success && btcDirectSupported?.supported && (
          <div className={style.infoContainer}>
            <Message type="info" icon={<Businessman/>}>
              {t('buy.exchange.infoContent.btcdirect.title')}
              <p>{t('buy.exchange.infoContent.btcdirect.info')}</p>
              <p>
                {!agreedTerms ? (
                  <Link to={'/exchange/btcdirect'} className={style.link}>
                    {t('buy.exchange.infoContent.btcdirect.link')}
                  </Link>
                ) : (
                  <A href={getBTCDirectLink()} className={style.link}>
                    {t('buy.exchange.infoContent.btcdirect.link')}
                  </A>
                )}
                    &nbsp;
                {isDarkMode ? <ExternalLinkWhite className={style.textIcon}/> : <ExternalLinkBlack className={style.textIcon}/>}
              </p>
            </Message>
            <InfoButton onClick={() => setInfo({ info: 'btcdirect' })} />
          </div>
        )}
      </div>
      {exchangeDealsResponse?.success && (
        <div className={style.buttonsContainer}>
          {showBackButton && (
            <Button
              className={style.buttonBack}
              secondary
              onClick={() => navigate('/exchange/info')}>
              {t('button.back')}
            </Button>
          )}
        </div>
      )}
    </>
  );
};
