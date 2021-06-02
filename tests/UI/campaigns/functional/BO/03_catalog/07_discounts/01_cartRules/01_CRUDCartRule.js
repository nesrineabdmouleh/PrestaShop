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

// Import data
const CartRuleFaker = require('@data/faker/cartRule');
const ProductData = require('@data/FO/product');
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
    code: '',
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
    generateCode: true,
    highlight: true,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRulepartialUseEnabled = new CartRuleFaker(
  {
    generateCode: true,
    partialUse: true,
    discountType: 'Percent',
    discountPercent: 20,
  },
);

const cartRulepartialUseDisabled = new CartRuleFaker(
  {
    generateCode: true,
    partialUse: false,
    discountType: 'Percent',
    discountPercent: 20,
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
        await testContext.addContextItem(this, 'testIdentifier', 'goToNewCartRulePage', baseContext);

        await cartRulesPage.goToAddNewCartRulesPage(page);

        const pageTitle = await addCartRulePage.getPageTitle(page);
        await expect(pageTitle).to.contains(addCartRulePage.pageTitle);
      });

      it('should create new cart rule', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'createCartRule', baseContext);

        const validationMessage = await addCartRulePage.createEditCartRules(page, cartRuleWithoutCode);
        await expect(validationMessage).to.contains(addCartRulePage.successfulCreationMessage);
      });
    });

    describe('Verify discount on FO', async () => {
      it('should view my shop', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'viewMyShopToCheckCreatedDiscount', baseContext);

        // View my shop and init pages
        page = await addCartRulePage.viewMyShop(page);

        await foHomePage.changeLanguage(page, 'en');
        const isHomePage = await foHomePage.isHomePage(page);
        await expect(isHomePage, 'Fail to open FO home page').to.be.true;
      });

      it('should go to the first product page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToFirstProductPage_1', baseContext);

        await foHomePage.goToProductPage(page, 1);

        const pageTitle = await foProductPage.getPageTitle(page);
        await expect(pageTitle.toUpperCase()).to.contains(ProductData.firstProductData.name);
      });

      it('should add product to cart and proceed to checkout', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'addProductToCart_1', baseContext);

        await foProductPage.addProductToTheCart(page);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(1);
      });

      it('should verify the total after discount', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'verifyTotalAfterDiscount', baseContext);

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
        await testContext.addContextItem(this, 'testIdentifier', 'removeProductFromShoppingCart', baseContext);

        await cartPage.deleteProduct(page, 1);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(0);
      });
    });
  });

  // 2 : Create cart rule with code and highlight disabled
  describe('case 2 : Create cart rule with code and highlight disabled then check it on FO', async () => {
    describe('Create cart rule on BO', async () => {
      it('should go back to BO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goBackToBo_2', baseContext);

        // Close tab and init other page objects with new current tab
        page = await foHomePage.closePage(browserContext, page, 0);

        const pageTitle = await cartRulesPage.getPageTitle(page);
        await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
      });

      it('should go to new cart rule page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToNewCartRulePage', baseContext);

        await cartRulesPage.goToAddNewCartRulesPage(page);

        const pageTitle = await addCartRulePage.getPageTitle(page);
        await expect(pageTitle).to.contains(addCartRulePage.pageTitle);
      });

      it('should create new cart rule', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'createCartRule', baseContext);

        const validationMessage = await addCartRulePage.createEditCartRules(page, cartRuleHighlightDisabled);
        await expect(validationMessage).to.contains(addCartRulePage.successfulCreationMessage);
      });
    });

    describe('Verify discount on FO', async () => {
      it('should view my shop', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'viewMyShopToCheckCreatedDiscount', baseContext);

        // View my shop and init pages
        page = await addCartRulePage.viewMyShop(page);

        await foHomePage.changeLanguage(page, 'en');
        const isHomePage = await foHomePage.isHomePage(page);
        await expect(isHomePage, 'Fail to open FO home page').to.be.true;
      });

      it('should go to the first product page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToFirstProductPage_1', baseContext);

        await foHomePage.goToProductPage(page, 1);

        const pageTitle = await foProductPage.getPageTitle(page);
        await expect(pageTitle.toUpperCase()).to.contains(ProductData.firstProductData.name);
      });

      it('should add product to cart and proceed to checkout', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'addProductToCart_1', baseContext);

        await foProductPage.addProductToTheCart(page);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(1);
      });

      it('should verify the total before the second discount', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'verifyTotalBeforeDiscount_1', baseContext);

        const discountedPrice = Products.demo_1.finalPrice
          - (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

        const priceATI = await cartPage.getATIPrice(page);
        await expect(priceATI).to.equal(parseFloat(discountedPrice.toFixed(2)));
      });

      it('should set the promo code', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'addPromoCode_1', baseContext);

        await cartPage.addPromoCode(page, cartRuleHighlightDisabled.code);
      });

      it('should verify the total after the second discount', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'verifyTotalAfterDiscount', baseContext);

        const totalPrice = Products.demo_1.finalPrice
          - (Products.demo_1.finalPrice * cartRuleWithoutCode.discountPercent / 100);

        const totalAfterPromoCode = totalPrice - (totalPrice * cartRuleHighlightDisabled.discountPercent / 100);

        const priceATI = await cartPage.getATIPrice(page);
        await expect(priceATI).to.equal(parseFloat(totalAfterPromoCode.toFixed(2)));

        const cartRuleName = await cartPage.getCartRuleName(page, 2);
        await expect(cartRuleName).to.equal(cartRuleHighlightDisabled.name);

        const discountValue = await cartPage.getDiscountValue(page, 2);
        await expect(discountValue).to.equal(parseFloat((totalAfterPromoCode - totalPrice).toFixed(2)));
      });

      it('should remove voucher and product from shopping cart', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'removeProductFromShoppingCart', baseContext);

        await cartPage.removeVoucher(page, 2);
        await cartPage.deleteProduct(page, 1);

        const notificationsNumber = await cartPage.getCartNotificationsNumber(page);
        await expect(notificationsNumber).to.be.equal(0);
      });
    });

    /*describe('Delete the created cart rule', async () => {
      it('should go back to BO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goBackToBo_2', baseContext);

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
    });*/
  });
});
