import AiHubMixProviderLogo from '@renderer/assets/images/providers/aihubmix.webp'
import SiliconFlowProviderLogo from '@renderer/assets/images/providers/silicon.png'
import { HStack } from '@renderer/components/Layout'
import OAuthButton from '@renderer/components/OAuth/OAuthButton'
import { PROVIDER_CONFIG } from '@renderer/config/providers'
import { Provider } from '@renderer/types'
import { providerBills, providerCharge } from '@renderer/utils/oauth'
import { Button } from 'antd'
import { isEmpty } from 'lodash'
import { ReceiptText } from 'lucide-react'
import { CircleDollarSign } from 'lucide-react'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  provider: Provider
  setApiKey: (apiKey: string) => void
}

const PROVIDER_LOGO_MAP = {
  silicon: SiliconFlowProviderLogo,
  aihubmix: AiHubMixProviderLogo
}

const ProviderOAuth: FC<Props> = ({ provider, setApiKey }) => {
  const { t } = useTranslation()

  const providerWebsite =
    PROVIDER_CONFIG[provider.id]?.api?.url.replace('https://', '').replace('api.', '') || provider.name

  return (
    <Container>
      <ProviderLogo src={PROVIDER_LOGO_MAP[provider.id]} />
      {isEmpty(provider.apiKey) ? (
        <OAuthButton provider={provider} onSuccess={setApiKey}>
          {t('settings.provider.oauth.button', { provider: t(`provider.${provider.id}`) })}
        </OAuthButton>
      ) : (
        <HStack gap={10}>
          <Button shape="round" icon={<CircleDollarSign size={16} />} onClick={() => providerCharge(provider.id)}>
            {t('settings.provider.charge')}
          </Button>
          <Button shape="round" icon={<ReceiptText size={16} />} onClick={() => providerBills(provider.id)}>
            {t('settings.provider.bills')}
          </Button>
        </HStack>
      )}
      <Description>
        <Trans
          i18nKey="settings.provider.oauth.description"
          components={{
            website: (
              <OfficialWebsite href={PROVIDER_CONFIG[provider.id].websites.official} target="_blank" rel="noreferrer" />
            )
          }}
          values={{ provider: providerWebsite }}
        />
      </Description>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
`

const ProviderLogo = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
`

const Description = styled.div`
  font-size: 11px;
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  gap: 5px;
`

const OfficialWebsite = styled.a`
  text-decoration: none;
  color: var(--color-text-2);
`

export default ProviderOAuth
