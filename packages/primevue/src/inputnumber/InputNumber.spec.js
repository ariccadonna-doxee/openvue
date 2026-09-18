import { mount } from '@vue/test-utils';
import InputNumber from './InputNumber.vue';

describe('InputNumber.vue', () => {
    let wrapper;

    beforeEach(() => {
        wrapper = mount(InputNumber, {
            props: {
                modelValue: 1
            }
        });
    });

    it('is exist', () => {
        expect(wrapper.find('.p-inputnumber.p-component').exists()).toBe(true);
        expect(wrapper.find('input.p-inputnumber-input').exists()).toBe(true);
    });

    it('is keydown called when down and up keys pressed', async () => {
        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: 1 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([2]);

        await wrapper.vm.onInputKeyDown({ code: 'ArrowDown', target: { value: 2 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual([1]);
    });

    it('is keydown called when tab key pressed', async () => {
        await wrapper.vm.onInputKeyDown({ code: 'Tab', target: { value: '12' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([12]);
        expect(wrapper.find('input.p-inputnumber-input').attributes()['aria-valuenow']).toBe('12');
    });

    it('is keydown called when enter key pressed', async () => {
        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '12' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([12]);
        expect(wrapper.find('input.p-inputnumber-input').attributes()['aria-valuenow']).toBe('12');
    });

    it('is keypress called when pressed a number', async () => {
        wrapper.find('input.p-inputnumber-input').element.setSelectionRange(2, 2);

        await wrapper.vm.onInputKeyPress({ key: '1', preventDefault: () => {} });

        expect(wrapper.emitted().input[0][0].value).toBe(11);
    });

    it('is keypress called when pressed minus', async () => {
        wrapper.find('input.p-inputnumber-input').element.setSelectionRange(0, 0);

        await wrapper.vm.onInputKeyPress({ key: '-', preventDefault: () => {} });

        expect(wrapper.emitted().input[0][0].value).toBe(-1);
    });

    it('should have min boundary', async () => {
        await wrapper.setProps({ modelValue: 95, min: 95 });

        await wrapper.vm.onInputKeyDown({ code: 'ArrowDown', target: { value: 96 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([95]);

        await wrapper.vm.onInputKeyDown({ code: 'ArrowDown', target: { value: 95 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual([95]);
    });

    it('should have max boundary', async () => {
        await wrapper.setProps({ modelValue: 99, max: 100 });

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: 99 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([100]);

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: 100 }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual([100]);
    });

    it('should have currency', async () => {
        await wrapper.setProps({ modelValue: 12345, mode: 'currency', currency: 'USD', locale: 'en-US' });

        expect(wrapper.find('input.p-inputnumber-input').element._value).toBe('$12,345.00');
    });

    it('should have prefix', async () => {
        await wrapper.setProps({ modelValue: 20, prefix: '%' });

        expect(wrapper.find('input.p-inputnumber-input').element._value).toBe('%20');
    });

    it('should step 0.1 without floating point drift', async () => {
        // spin() reads the live input element, so each ArrowUp builds on the previous one.
        await wrapper.setProps({ modelValue: 0, step: 0.1, minFractionDigits: 1 });

        const input = wrapper.find('input.p-inputnumber-input').element;

        for (let i = 0; i < 10; i++) {
            await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: input, preventDefault: () => {} });
        }

        const emitted = wrapper.emitted()['update:modelValue'].map(([value]) => value);

        // Repeatedly adding 0.1 as a double drifts to 0.30000000000000004 and lands on
        // 0.9999999999999999 instead of 1.
        expect(emitted).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    });

    it('should preserve digits beyond Number.MAX_SAFE_INTEGER', async () => {
        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '123456789012345678' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['123456789012345678']);

        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '999999999999999999' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual(['999999999999999999']);
    });

    it('should step exactly beyond Number.MAX_SAFE_INTEGER', async () => {
        await wrapper.setProps({ modelValue: '123456789012345678' });

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: '123456789012345678' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['123456789012345679']);
    });

    it('should accept a string modelValue and render it exactly', async () => {
        await wrapper.setProps({ modelValue: '123456789012345678', locale: 'en-US' });

        expect(wrapper.find('input.p-inputnumber-input').element._value).toBe('123,456,789,012,345,678');
    });

    it('should clamp against string boundaries exactly', async () => {
        await wrapper.setProps({ modelValue: '999999999999999998', max: '999999999999999999' });

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: '999999999999999998' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['999999999999999999']);

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: { value: '999999999999999999' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual(['999999999999999999']);
    });

    it('should keep the minus sign after typing a negative zero', async () => {
        // toDecimalString canonicalizes '-0' to '0'. The field must still show the minus, so a
        // negative value stays reachable while typing.
        await wrapper.setProps({ modelValue: null });

        const input = wrapper.find('input.p-inputnumber-input').element;

        input.setSelectionRange(0, 0);

        await wrapper.vm.onInputKeyPress({ key: '-', preventDefault: () => {} });
        await wrapper.vm.onInputKeyPress({ key: '0', preventDefault: () => {} });

        expect(input.value).toBe('-0');
    });

    it('should emit a canonical zero for a typed negative zero', async () => {
        // The transient '-0' never reaches the consumer.
        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '-0' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual([0]);
    });

    it('should not report a spurious change when spinning in a group-separator locale', async () => {
        // parseValue strips '.' as a group separator in it-IT, so spin must hand handleOnInput
        // the formatted text rather than the already-parsed decimal.
        await wrapper.setProps({ modelValue: 10.5, locale: 'it-IT', max: 10.5, step: 1, minFractionDigits: 1 });

        const input = wrapper.find('input.p-inputnumber-input').element;

        await wrapper.vm.onInputKeyDown({ code: 'ArrowUp', target: input, preventDefault: () => {} });

        expect(wrapper.emitted().input).toBeUndefined();
    });

    it('should honour modelValueType', async () => {
        await wrapper.setProps({ modelValueType: 'string' });

        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '12' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['12']);

        await wrapper.setProps({ modelValueType: 'number' });

        await wrapper.vm.onInputKeyDown({ code: 'Enter', target: { value: '12' }, preventDefault: () => {} });

        expect(wrapper.emitted()['update:modelValue'][1]).toEqual([12]);
    });
});
