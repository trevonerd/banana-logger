import PinoPretty from 'pino-pretty';

const emojiLevels = {
    20: '🐒',
    30: '🍌',
    40: '⚠️',
    50: '🚨'
};

const pinoPrettyConfig = (opts) => PinoPretty({
    ...opts,
    translateTime: '[yyyy-mm-dd HH:MM:ss.l]',
    customPrettifiers: {
        time: timestamp => `🕰  ${timestamp}`,
        level: (logLevel, key, log, { labelColorized }) => `${emojiLevels[logLevel]} ${labelColorized}`,
    },
});

export default pinoPrettyConfig;
