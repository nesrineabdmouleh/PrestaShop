require('module-alias/register');
// Using chai
const {expect} = require('chai');

// Import utils
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Import pages
const dashboardPage = require('@pages/BO/dashboard');
const cartRulesPage = require('@pages/BO/catalog/discounts');
const addCartRulePage = require('@pages/BO/catalog/discounts/add');
const foHomePage = require('@pages/FO/home');
const foLoginPage = require('@pages/FO/login');
const foProductPage = require('@pages/FO/product');
const cartPage = require('@pages/FO/cart');
const checkoutPage = require('@pages/FO/checkout');
const orderHistory = require('@pages/FO/myAccount/orderHistory');
const myAccountPage = require('@pages/FO/myAccount');
const vouchersPage = require('@pages/FO/myAccount/vouchers');

// Import data
const CartRuleFaker = require('@data/faker/cartRule');
const ProductData = require('@data/FO/product');
const {PaymentMethods} = require('@data/demo/paymentMethods');
const {DefaultCustomer} = require('@data/demo/customer');
const {Products} = require('@data/demo/products');

// import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_catalog_discounts_cartRules_CRUDCartRule';

let browserContext;
let page;

const cartRuleWithoutCode = new CartRuleFaker(
  {
    name: 'withoutCode',
    discountType: 'Percent',
    discountPercent: 20,
  },
);
const cartRuleHighlightDisabled = new CartRuleFaker(
  {
    name: 'highlightDisabled',
    code: '4QABV6L3',
    highlight: false,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRuleHighlightEnabled = new CartRuleFaker(
  {
    name: 'highlightEnabled',
    code: '4QABV6L3',
    highlight: true,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRulePartialUseEnabled = new CartRuleFaker(
  {
    name: 'partialUseEnabled',
    partialUse: true,
    discountType: 'Amount',
    discountAmount: {
      value: 100,
      currency: 'EUR',
      tax: 'Tax included',
    },
  },
);

const cartRulePartialUseDisabled = new CartRuleFaker(
  {
    name: 'partialUseDisabled',
    code: '',
    partialUse: false,
    discountType: 'Amount',
    discountAmount: {
      value: 100,
      currency: 'EUR',
      tax: 'Tax included',
    },
  },
);

const cartRulePriority = new CartRuleFaker(
  {
    generateCode: true,
    priority: 2,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRuleStatusDisabled = new CartRuleFaker(
  {
    generateCode: true,
    status: false,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRuleLimitSingleCustomer = new CartRuleFaker(
  {
    generateCode: true,
    customer: 'pub@prestashop.com',
    discountType: 'Percent',
    discountPercent: 20,
  },
);


describe('Catalog - Discounts : CRUD cart rule', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await loginCommon.loginBO(this, page);
  });

  it('should go to \'Catalog > Discounts\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToDiscountsPage', baseContext);

    await dashboardPage.goToSubMenu(
      page,
      dashboardPage.catalogParentLink,
      dashboardPage.discountsLink,
    );

    const pageTitle = await cartRulesPage.getPageTitle(page);
    await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
  });

  // 1 : Create cart rule without code
  describe('case 1 : Create cart rule without code then check it on FO', async () => {
    describe('Create cart rule on BO', async () => {
      it('should go to new cart rule page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToNewCartRulePage1', baseContext);

        await cartRulesPage.goToAddNewCartRulesPage(page);

        const pageTitle = await addCartRulePage.getPageTitle(page);
        await expect(pageTitle).to.contains(addCartRulePage.pageTitle);
      });

      it('should create new cart rule', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'createCartRule1', baseContext);

        const validationMessage = await addCartRulePage.createEditCartRules(page, cartRuleWithoutCode);
        await expect(validationMessage).to.contains(addCartRulePage.successfulCreationMessage);
      });
    });

    describe('Verify discount on FO', async () => {
      it('should view my shop', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'viewMyShop1', baseContext);

        // View my shop and init pages
        page = await addCartRulePage.viewMyShop(page);

        await foHomePage.changeLanguage(page, 'en');
        const isHomePage = await foHomePage.isHomePage(page);
        await expect(isHomePage, 'Fail to open FO home page').to.be.true;
      });

      it('should go to the first product page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToFirstProductPage1', baseContext);

        await foHomePage.goToProductPage(page, 1);

        const pageTitle = await foProductPage.getPageTitle(page);
        await expect(pageTitle.toUpperCase()).to.contains(ProductData.firstProductData.name);
      });

      it('should add product to cart and proceed to checkout', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'addProductToCart1', baseContext);

        await foProductPage.addProductToTheCart(page);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(1);
      });

      it('should verify the total after discount', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'verifyTotalAfterDiscount1', baseContext);

        const totalAfterDiscount = Products.demo_1.finalPrice
          - (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

        const priceATI = await cartPage.getATIPrice(page);
        await expect(priceATI).to.equal(parseFloat(totalAfterDiscount.toFixed(2)));

        const cartRuleName = await cartPage.getCartRuleName(page);
        await expect(cartRuleName).to.equal(cartRuleWithoutCode.name);

        const discountValue = await cartPage.getDiscountValue(page);
        await expect(discountValue).to.equal(parseFloat(totalAfterDiscount.toFixed(2)) - Products.demo_1.finalPrice);
      });

      it('should remove product from shopping cart', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'removeProductFromShoppingCart1', baseContext);

        await cartPage.deleteProduct(page, 1);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(0);
      });
    });
  });

  // 2 - 3 : Create cart rule with code and highlight disabled/enabled
  [
    {
      args: {
        describeTitle: 'Create cart rule with code and highlight disabled',
        cartRuleData: cartRuleHighlightDisabled,
      },
    },
    {
      args: {
        describeTitle: 'Create cart rule with code and highlight enabled',
        cartRuleData: cartRuleHighlightEnabled,
        cartRuleToUpdate: cartRuleHighlightDisabled,
      },
    },
  ].forEach((test, index) => {
    describe(`Case ${index + 2} : ${test.args.describeTitle} then check it on FO`, async () => {
      if (index === 0) {
        describe('Create cart rule on BO', async () => {
          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index + 2}`, baseContext);

            // Close tab and init other page objects with new current tab
            page = await foHomePage.closePage(browserContext, page, 0);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should go to new cart rule page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goToNewCartRulePage${index + 2}`, baseContext);

            await cartRulesPage.goToAddNewCartRulesPage(page);

            const pageTitle = await addCartRulePage.getPageTitle(page);
            await expect(pageTitle).to.contains(addCartRulePage.pageTitle);
          });

          it('should create new cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `createCartRule${index + 2}`, baseContext);

            const validationMessage = await addCartRulePage.createEditCartRules(page, test.args.cartRuleData);
            await expect(validationMessage).to.contains(addCartRulePage.successfulCreationMessage);
          });
        });
      }

      if (index !== 0) {
        describe('Update cart rule on BO', async () => {
          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index + 2}`, baseContext);

            // Close tab and init other page objects with new current tab
            page = await foHomePage.closePage(browserContext, page, 0);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should search for the cart rule to edit', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `searchCartRuleToUpdate${index + 2}`, baseContext);

            await cartRulesPage.filterCartRules(page, 'input', 'name', test.args.cartRuleToUpdate.name);

            const numberOfCartRulesAfterFilter = await cartRulesPage.getNumberOfElementInGrid(page);
            await expect(numberOfCartRulesAfterFilter).to.be.equal(1);
          });

          it('should go to edit cart rule page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goToEditCartRulePage${index + 2}`, baseContext);

            await cartRulesPage.goToEditCartRulePage(page, 1);

            const pageTitle = await addCartRulePage.getPageTitle(page);
            await expect(pageTitle).to.contains(addCartRulePage.editPageTitle);
          });

          it('should update cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `updateCartRule${index + 2}`, baseContext);

            const validationMessage = await addCartRulePage.createEditCartRules(page, test.args.cartRuleData);
            await expect(validationMessage).to.contains(addCartRulePage.successfulUpdateMessage);
          });
        });
      }

      describe('Verify discount on FO', async () => {
        it('should view my shop', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `viewMyShop${index + 2}`, baseContext);

          // View my shop and init pages
          page = await addCartRulePage.viewMyShop(page);

          await foHomePage.changeLanguage(page, 'en');
          const isHomePage = await foHomePage.isHomePage(page);
          await expect(isHomePage, 'Fail to open FO home page').to.be.true;
        });

        it('should go to the first product page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToFirstProductPage${index + 2}`, baseContext);

          await foHomePage.goToProductPage(page, 1);

          const pageTitle = await foProductPage.getPageTitle(page);
          await expect(pageTitle.toUpperCase()).to.contains(ProductData.firstProductData.name);
        });

        it('should add product to cart and proceed to checkout', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `addProductToCart${index + 2}`, baseContext);

          await foProductPage.addProductToTheCart(page);

          const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
          await expect(notificationsNumber).to.be.equal(1);
        });

        it('should verify the total before the second discount', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkTotalBeforeDiscount${index + 2}`, baseContext);

          const discountedPrice = Products.demo_1.finalPrice
            - (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

          const priceATI = await cartPage.getATIPrice(page);
          await expect(priceATI).to.equal(parseFloat(discountedPrice.toFixed(2)));
        });

        it('should set the promo code', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `addPromoCode${index + 2}`, baseContext);

          if (test.args.cartRuleData === cartRuleHighlightDisabled) {
            await cartPage.addPromoCode(page, test.args.cartRuleData.code);
          } else {
            await cartPage.addPromoCode(page, test.args.cartRuleData.code, false);
          }
        });

        it('should verify the total after the second discount', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkTotalAfterDiscount${index + 2}`, baseContext);

          const totalPrice = Products.demo_1.finalPrice
            - (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

          const totalAfterPromoCode = totalPrice - (totalPrice * test.args.cartRuleData.discountPercent / 100);

          const priceATI = await cartPage.getATIPrice(page);
          await expect(priceATI).to.equal(parseFloat(totalAfterPromoCode.toFixed(2)));

          const cartRuleName = await cartPage.getCartRuleName(page, 2);
          await expect(cartRuleName).to.equal(test.args.cartRuleData.name);

          const discountValue = await cartPage.getDiscountValue(page, 2);
          await expect(discountValue).to.equal(parseFloat((totalAfterPromoCode - totalPrice).toFixed(2)));
        });

        it('should remove voucher and product from shopping cart', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `removeProduct${index + 2}`, baseContext);

          await cartPage.removeVoucher(page, 2);
          await cartPage.deleteProduct(page, 1);

          const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
          await expect(notificationsNumber).to.be.equal(0);
        });
      });
    });
  });

  // 4 - 5 : Create cart Rule Partial use enabled/disabled
  [
    {
      args: {
        describeTitle: 'Create cart rule with code and partial use enabled',
        cartRuleData: cartRulePartialUseEnabled,
        cartRuleToUpdate: cartRuleHighlightEnabled,
        voucherLine: 2,
      },
    },
    {
      args: {
        describeTitle: 'Create cart rule with code and partial use disabled',
        cartRuleData: cartRulePartialUseDisabled,
        voucherLine: 1,
      },
    },
  ].forEach((test, index) => {
    describe(`Case ${index + 4} : ${test.args.describeTitle} then check it on FO`, async () => {
      if (test.args.cartRuleData === cartRulePartialUseDisabled) {
        describe('Create cart rule on BO', async () => {
          it('should go to new cart rule page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goToNewCartRulePage${index + 4}`, baseContext);

            await cartRulesPage.goToAddNewCartRulesPage(page);

            const pageTitle = await addCartRulePage.getPageTitle(page);
            await expect(pageTitle).to.contains(addCartRulePage.pageTitle);
          });

          it('should create new cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `createCartRule${index + 4}`, baseContext);

            const validationMessage = await addCartRulePage.createEditCartRules(page, test.args.cartRuleData);
            await expect(validationMessage).to.contains(addCartRulePage.successfulCreationMessage);
          });
        });
      }

      if (test.args.cartRuleData === cartRulePartialUseEnabled) {
        describe('Update cart rule on BO', async () => {
          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index + 4}`, baseContext);

            // Close tab and init other page objects with new current tab
            page = await foHomePage.closePage(browserContext, page, 0);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should search for the cart rule to edit', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `searchCartRuleToUpdate${index + 4}`, baseContext);

            await cartRulesPage.filterCartRules(page, 'input', 'name', cartRuleHighlightEnabled.name);

            const numberOfCartRulesAfterFilter = await cartRulesPage.getNumberOfElementInGrid(page);
            await expect(numberOfCartRulesAfterFilter).to.be.equal(1);
          });

          it('should go to edit cart rule page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goToEditCartRulePage${index + 4}`, baseContext);

            await cartRulesPage.goToEditCartRulePage(page, 1);

            const pageTitle = await addCartRulePage.getPageTitle(page);
            await expect(pageTitle).to.contains(addCartRulePage.editPageTitle);
          });

          it('should update cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `updateCartRule${index + 4}`, baseContext);

            const validationMessage = await addCartRulePage.createEditCartRules(page, test.args.cartRuleData);
            await expect(validationMessage).to.contains(addCartRulePage.successfulUpdateMessage);
          });
        });
      }

      describe('Verify discount on FO', async () => {
        it('should view my shop', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `viewMyShop${index + 2}`, baseContext);

          // View my shop and init pages
          page = await addCartRulePage.viewMyShop(page);

          await foHomePage.changeLanguage(page, 'en');
          const isHomePage = await foHomePage.isHomePage(page);
          await expect(isHomePage, 'Fail to open FO home page').to.be.true;
        });

        if (index === 0) {
          it('should go to login page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'goToLoginPageFO', baseContext);

            await foHomePage.goToLoginPage(page);

            const pageTitle = await foLoginPage.getPageTitle(page);
            await expect(pageTitle, 'Fail to open FO login page').to.contains(foLoginPage.pageTitle);
          });

          it('should sign in with default customer', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'sighInFO', baseContext);

            await foLoginPage.customerLogin(page, DefaultCustomer);

            const isCustomerConnected = await foLoginPage.isCustomerConnected(page);
            await expect(isCustomerConnected, 'Customer is not connected').to.be.true;
          });
        }

        it('should go to the first product page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToFirstProductPage${index + 4}`, baseContext);

          // Go to home page
          await foLoginPage.goToHomePage(page);

          await foHomePage.goToProductPage(page, 1);

          const pageTitle = await foProductPage.getPageTitle(page);
          await expect(pageTitle.toUpperCase()).to.contains(ProductData.firstProductData.name);
        });

        it('should add product to cart and proceed to checkout', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `addProductToCart${index + 4}`, baseContext);

          await foProductPage.addProductToTheCart(page);

          const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
          await expect(notificationsNumber).to.be.equal(1);
        });

        it('should verify the total before the discount created', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkTotalBeforeDiscount${index + 4}`, baseContext);

          const priceATI = await cartPage.getATIPrice(page);
          await expect(priceATI).to.equal(0.00);

          const cartRuleName = await cartPage.getCartRuleName(page, test.args.voucherLine);
          await expect(cartRuleName).to.equal(test.args.cartRuleData.name);

          const discountValue = await cartPage.getDiscountValue(page, test.args.voucherLine);
          await expect(discountValue.toString()).to.equal(`-${Products.demo_1.finalPrice}`);
        });

        it('should go to delivery step', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToDeliveryStep${index + 4}`, baseContext);

          // Proceed to checkout the shopping cart
          await cartPage.clickOnProceedToCheckout(page);

          // Address step - Go to delivery step
          const isStepAddressComplete = await checkoutPage.goToDeliveryStep(page);
          await expect(isStepAddressComplete, 'Step Address is not complete').to.be.true;
        });

        it('should go to payment step', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToPaymentStep${index + 4}`, baseContext);

          // Delivery step - Go to payment step
          const isStepDeliveryComplete = await checkoutPage.goToPaymentStep(page);
          await expect(isStepDeliveryComplete, 'Step Address is not complete').to.be.true;
        });

        it('should check that there is no payment methods and check \'Agree terms of service\'', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkPaymentMethods${index + 4}`, baseContext);

          // Check payment method existence
          let isVisible = await checkoutPage.isPaymentMethodExist(page, PaymentMethods.wirePayment.moduleName);
          await expect(isVisible).to.be.equal(false);

          isVisible = await checkoutPage.isPaymentMethodExist(page, PaymentMethods.checkPayment.moduleName);
          await expect(isVisible).to.be.equal(false);
        });

        it('should check \'Agree terms of service\' and place order', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `placeOrder${index + 4}`, baseContext);

          // Agree terms of service
          await checkoutPage.agreeTermsOfService(page);

          // Place order
          await checkoutPage.placeOrder(page);

          // Check order history page
          const pageTitle = await orderHistory.getPageTitle(page);
          await expect(pageTitle).to.contains(orderHistory.pageTitle);
        });

        it('should go to \'My account\' page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToMyAccountPage${index + 4}`, baseContext);

          // Go to home page
          await orderHistory.goToHomePage(page);

          // Go to my account page
          await foHomePage.goToMyAccountPage(page);

          const pageTitle = await myAccountPage.getPageTitle(page);
          await expect(pageTitle).to.equal(myAccountPage.pageTitle);
        });

        it('should go to \'My account > Vouchers\' page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToMyVoucherPage${index + 4}`, baseContext);

          await myAccountPage.goToVouchersPage(page);

          const pageHeaderTitle = await vouchersPage.getPageTitle(page);
          await expect(pageHeaderTitle).to.equal(vouchersPage.pageTitle);
        });

        if (test.args.cartRuleData === cartRulePartialUseEnabled) {
          it('should verify the voucher generated', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'verifyGeneratedVoucher', baseContext);

            const discountValue = (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

            const code = await vouchersPage.getTextColumnFromTable(page, 3, 'code');
            await expect(code).to.not.equal('');

            const description = await vouchersPage.getTextColumnFromTable(page, 3, 'description');
            await expect(description).to.equal(cartRulePartialUseEnabled.name);

            const quantity = await vouchersPage.getTextColumnFromTable(page, 3, 'quantity');
            await expect(quantity).to.equal('1');

            const value = await vouchersPage.getTextColumnFromTable(page, 3, 'value');
            await expect(value).to.equal(
              `€${cartRulePartialUseEnabled.discountAmount.value
              - (Products.demo_1.finalPrice - discountValue.toFixed(2))} Tax included`);
          });
        } else {
          it('should verify that there is only one voucher', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'verifyVoucher', baseContext);

            const code = await vouchersPage.getTextColumnFromTable(page, 1, 'code');
            await expect(code).to.equal('');

            const description = await vouchersPage.getTextColumnFromTable(page, 1, 'description');
            await expect(description).to.equal(test.args.cartRuleData.name);

            const quantity = await vouchersPage.getTextColumnFromTable(page, 1, 'quantity');
            await expect(quantity).to.equal('0');

            const value = await vouchersPage.getTextColumnFromTable(page, 1, 'value');
            await expect(value).to.equal(`€${cartRulePartialUseEnabled.discountAmount.value.toFixed(2)} Tax included`);
          });
        }
      });

      if (test.args.cartRuleData === cartRulePartialUseEnabled) {
        describe('Verify the cart rule created on BO', async () => {
          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index + 4}`, baseContext);

            // Close tab and init other page objects with new current tab
            page = await foHomePage.closePage(browserContext, page, 0);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should search for the cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `searchCartRuleToUpdate${index + 4}`, baseContext);

            await cartRulesPage.filterCartRules(page, 'input', 'name', test.args.cartRuleData.name);

            const numberOfCartRulesAfterFilter = await cartRulesPage.getNumberOfElementInGrid(page);
            if (test.args.cartRuleData === cartRulePartialUseEnabled) {
              await expect(numberOfCartRulesAfterFilter).to.be.equal(2);
            } else {
              await expect(numberOfCartRulesAfterFilter).to.be.equal(1);
            }
          });


          it('should go to edit cart rule page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goToEditCartRulePage${index + 4}`, baseContext);

            await cartRulesPage.goToEditCartRulePage(page, 1);

            const pageTitle = await addCartRulePage.getPageTitle(page);
            await expect(pageTitle).to.contains(addCartRulePage.editPageTitle);
          });

          it('should check in conditions tab that the cart rule is limited to a single customer', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `updateCartRule${index + 4}`, baseContext);

            const customer = await addCartRulePage.getCartRuleCustomer(page);
            await expect(customer).to.contains(DefaultCustomer.email);
          });
        });

        describe('Delete all cart rules created by bulk actions', async () => {
          it('should go to \'Cart rules\' page', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'cancelPage', baseContext);

            await addCartRulePage.cancelPage(page);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should delete cart rules created by bulk actions', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'bulkDelete', baseContext);

            const cartRulesNumber = await cartRulesPage.resetAndGetNumberOfLines(page);
            expect(cartRulesNumber).to.equal(3);

            const deleteTextResult = await cartRulesPage.bulkDeleteCartRules(page);
            await expect(deleteTextResult).to.be.contains(cartRulesPage.successfulMultiDeleteMessage);
          });
        });
      } else {
        describe('Delete cart rule created', async () => {
          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index + 4}`, baseContext);

            // Close tab and init other page objects with new current tab
            page = await foHomePage.closePage(browserContext, page, 0);

            const pageTitle = await cartRulesPage.getPageTitle(page);
            await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
          });

          it('should delete cart rule', async function () {
            await testContext.addContextItem(this, 'testIdentifier', 'deleteCartRule', baseContext);

            const validationMessage = await cartRulesPage.deleteCartRule(page);
            await expect(validationMessage).to.contains(cartRulesPage.successfulDeleteMessage);
          });
        });
      }
    });
  });
});
