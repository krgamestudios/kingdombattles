export const SET_ATTACK_DISABLED = 'SET_ATTACK_DISABLED';

export function setAttackDisabled(disabled) {
	return {
		type: SET_ATTACK_DISABLED,
		disabled: disabled
	}
}