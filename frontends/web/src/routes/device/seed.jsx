import { Component } from 'preact';
import { translate } from 'react-i18next';
import { apiPost } from '../../utils/request';
import Backups from '../../components/backups/backups';
import { PasswordRepeatInput } from '../../components/password';
import { Button, Input } from '../../components/forms';
import Message from '../../components/message/message';
import { BitBox } from '../../components/icon/logo';
import { Guide } from '../../components/guide/guide';
import Footer from '../../components/footer/footer';
import Spinner from '../../components/spinner/Spinner';
import style from './device.css';

const stateEnum = Object.freeze({
    DEFAULT: 'default',
    WAITING: 'waiting',
    ERROR: 'error',
});

@translate()
export default class Seed extends Component {
    state = {
        status: stateEnum.DEFAULT,
        walletName: '',
        backupPassword: '',
        error: '',
        fromBackup: false,
    }

    validate = () => {
        if (!this.walletNameInput || !this.walletNameInput.validity.valid) {
            return false;
        }
        return this.state.backupPassword && this.state.walletName !== '';
    }

    handleFormChange = event => {
        this.setState({ [event.target.id]: event.target.value });
    }

    handleSubmit = event => {
        event.preventDefault();
        if (!this.validate()) {
            return;
        }
        this.setState({
            status: stateEnum.WAITING,
            error: '',
        });
        apiPost('devices/' + this.props.deviceID + '/create-wallet', {
            walletName: this.state.walletName,
            backupPassword: this.state.backupPassword
        }).then(data => {
            if (!data.success) {
                this.displayError(data.errorMessage);
            }
            if (this.backupPasswordInput) {
                this.backupPasswordInput.clear();
            }
            this.setState({ backupPassword: '' });
        });
    }

    displayError = error => {
        this.setState({
            status: stateEnum.ERROR,
            error,
        });
    }

    setValidBackupPassword = backupPassword => {
        this.setState({ backupPassword });
    }

    render({
        t,
        deviceID,
        guide,
    }, {
        status,
        walletName,
        error,
        fromBackup,
    }) {
        const errorMessage = (
            <Message type={status === 'error' && 'error'}>
                {status === stateEnum.ERROR ? error : null}
            </Message>
        );

        const content = fromBackup ? (
            <Backups
                showCreate={false}
                displayError={this.displayError}
                deviceID={deviceID}
                requireConfirmation={false}>
                <Button
                    type="button"
                    transparent
                    onClick={() => this.setState({ fromBackup: false })}>
                    Or go back to create a new wallet…
                </Button>
            </Backups>
        ) : (
            <form onSubmit={this.handleSubmit}>
                <div>
                    <Input
                        pattern="^[0-9a-zA-Z-_.]{1,31}$"
                        autoFocus
                        id="walletName"
                        label={t('seed.walletName.label')}
                        placeholder={t('seed.walletName.placeholder')}
                        disabled={status === stateEnum.WAITING}
                        onInput={this.handleFormChange}
                        getRef={ref => this.walletNameInput = ref}
                        value={walletName}
                    />
                    <PasswordRepeatInput
                        label={t('seed.password.label')}
                        ref={ref => this.backupPasswordInput = ref}
                        disabled={status === stateEnum.WAITING}
                        onValidPassword={this.setValidBackupPassword}
                    />
                </div>
                <p>{t('seed.description')}</p>
                <div>
                    <Button
                        type="submit"
                        primary
                        disabled={!this.validate() || status === stateEnum.WAITING}>
                        {t('seed.create')}
                    </Button>
                    <Button
                        type="button"
                        transparent
                        onClick={() => this.setState({ fromBackup: true, error: '' })}>
                        {t('seed.backup')}
                    </Button>
                </div>
            </form>
        );

        return (
            <div class="contentWithGuide">
                <div className={style.container}>
                    <BitBox />
                    <div className={style.content}>
                        {errorMessage}
                        {content}
                        <hr />
                        <Footer />
                    </div>
                    {
                        status === stateEnum.WAITING && (
                            <Spinner />
                        )
                    }
                </div>
                <Guide guide={guide} screen="seed" />
            </div>
        );
    }
}
