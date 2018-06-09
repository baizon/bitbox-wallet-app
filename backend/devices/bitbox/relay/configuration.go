package relay

type configuration struct {
	Version           int    `json:"version"`
	ChannelID         string `json:"channel"`
	EncryptionKey     []byte `json:"encryption"`
	AuthenticationKey []byte `json:"authentication"`
}

func newConfiguration(channel *Channel) *configuration {
	return &configuration{
		Version:           1,
		ChannelID:         channel.ChannelID,
		EncryptionKey:     channel.EncryptionKey,
		AuthenticationKey: channel.AuthenticationKey,
	}
}

func (config *configuration) channel() *Channel {
	return NewChannel(config.ChannelID, config.EncryptionKey, config.AuthenticationKey)
}
