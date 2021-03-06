const { Utils, Service } = Shopware;
const { get } = Utils;

function filterEmptyLineItems(items) {
    return items.filter(item => item.label === '');
}

function reverseLineItems(items) {
    return items.slice().reverse();
}

function mergeEmptyAndExistingLineItems(emptyLineItems, lineItems) {
    // Reverse the lineItems so the newly added are at the top for better UX
    const reversedLineItems = reverseLineItems(lineItems);

    return [...emptyLineItems, ...reversedLineItems];
}

export default {
    namespaced: true,

    state() {
        return {
            customer: null,
            defaultSalesChannel: null,
            cart: {
                token: null,
                lineItems: []
            },
            currency: {
                shortName: 'EUR'
            }
        };
    },

    mutations: {
        setCustomer(state, customer) {
            state.customer = customer;
        },

        setDefaultSalesChannel(state, salesChannel) {
            state.defaultSalesChannel = salesChannel;
        },

        setCartToken(state, token) {
            state.cart.token = token;
        },

        setCart(state, cart) {
            const emptyLineItems = filterEmptyLineItems(state.cart.lineItems);
            state.cart = cart;
            state.cart.lineItems = mergeEmptyAndExistingLineItems(emptyLineItems, state.cart.lineItems);
        },

        setCartLineItems(state, lineItems) {
            state.cart.lineItems = lineItems;
        },

        setCurrency(state, currency) {
            state.currency = currency;
        },

        removeEmptyLineItem(state, emptyLineItemKey) {
            state.cart.lineItems = state.cart.lineItems.filter(item => item.id !== emptyLineItemKey);
        }
    },

    getters: {
        isCustomerActive(state) {
            return get(state, 'customer.active', false);
        },

        currencyId(state) {
            return get(state, 'currency.id', null);
        }
    },

    actions: {
        selectExistingCustomer({ commit }, { customer }) {
            commit('setCustomer', customer);
            commit('setDefaultSalesChannel', { ...get(customer, 'salesChannel', null) });
        },

        createCart({ commit, dispatch }, { salesChannelId }) {
            return Service('cartSalesChannelService')
                .createCart(salesChannelId)
                .then(response => {
                    commit('setCartToken', response.data['sw-context-token']);
                    dispatch('dispatchUpdateCustomerContext');
                });
        },

        getCart({ commit }, { salesChannelId, contextToken }) {
            return Service('cartSalesChannelService')
                .getCart(salesChannelId, contextToken)
                .then((response) => commit('setCart', response.data.data));
        },

        cancelCart(_, { salesChannelId, contextToken }) {
            return Service('cartSalesChannelService')
                .cancelCart(salesChannelId, contextToken);
        },

        dispatchUpdateCustomerContext({ state }) {
            const { customer, cart } = state;
            return Service('salesChannelContextService')
                .updateCustomerContext(customer.id, customer.salesChannelId, cart.token);
        },

        updateCustomerContext(_, { customerId, salesChannelId, contextToken }) {
            return Service('salesChannelContextService')
                .updateCustomerContext(customerId, salesChannelId, contextToken);
        },

        updateOrderContext(_, { context, salesChannelId, contextToken }) {
            return Service('salesChannelContextService')
                .updateContext(context, salesChannelId, contextToken);
        },

        saveOrder(_, { salesChannelId, contextToken }) {
            return Service('checkOutSalesChannelService')
                .checkout(salesChannelId, contextToken);
        },

        addProductItem({ commit }, { salesChannelId, contextToken, productId, quantity }) {
            return Service('cartSalesChannelService')
                .addProduct(salesChannelId, contextToken, productId, quantity)
                .then(response => commit('setCart', response.data.data));
        },

        removeLineItems({ commit }, { salesChannelId, contextToken, lineItemKeys }) {
            return Service('cartSalesChannelService')
                .removeLineItems(salesChannelId, contextToken, lineItemKeys)
                .then(response => commit('setCart', response.data.data));
        },

        updateLineItem({ commit }, { salesChannelId, contextToken, item }) {
            return Service('cartSalesChannelService')
                .updateLineItem(salesChannelId, contextToken, item)
                .then((response) => commit('setCart', response.data.data));
        },

        addCustomItem({ commit }, { salesChannelId, contextToken, item }) {
            return Service('cartSalesChannelService')
                .addCustomItem(salesChannelId, contextToken, item)
                .then(response => commit('setCart', response.data.data));
        }
    }
};
