export enum EActivityDataStatus {
    inactive,
    active,
    processing,
    processed,
    failedOnce,
    failedTwice,
    failedThrice,
}

export enum EActivityDataMode {
    computer = 'computer',
    remote = 'remote'
}