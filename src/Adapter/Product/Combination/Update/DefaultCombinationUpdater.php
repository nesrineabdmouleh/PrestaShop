<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

declare(strict_types=1);

namespace PrestaShop\PrestaShop\Adapter\Product\Combination\Update;

use Combination;
use PrestaShop\PrestaShop\Adapter\Product\Combination\Repository\CombinationMultiShopRepository;
use PrestaShop\PrestaShop\Core\Domain\Product\Combination\Exception\CannotAddCombinationException;
use PrestaShop\PrestaShop\Core\Domain\Product\Combination\Exception\CannotUpdateCombinationException;
use PrestaShop\PrestaShop\Core\Domain\Product\Combination\Exception\CombinationNotFoundException;
use PrestaShop\PrestaShop\Core\Domain\Product\Combination\ValueObject\CombinationId;
use PrestaShop\PrestaShop\Core\Domain\Product\Exception\ProductConstraintException;
use PrestaShop\PrestaShop\Core\Domain\Product\ValueObject\ProductId;
use PrestaShop\PrestaShop\Core\Domain\Shop\ValueObject\ShopConstraint;
use PrestaShop\PrestaShop\Core\Exception\CoreException;

/**
 * Responsible for updating product default combination
 */
class DefaultCombinationUpdater
{
    /**
     * @var CombinationMultiShopRepository
     */
    private $combinationRepository;

    /**
     * @param CombinationMultiShopRepository $combinationRepository
     */
    public function __construct(
        CombinationMultiShopRepository $combinationRepository
    ) {
        $this->combinationRepository = $combinationRepository;
    }

    /**
     * Marks the provided combination as default (combination->default_on)
     * and removes the mark from previous default combination
     *
     * Notice: Product->cache_default_attribute is updated in Product add(), update(), delete() methods.
     *
     * @see Product::updateDefaultAttribute()
     *
     * @param CombinationId $defaultCombinationId
     * @param ShopConstraint $shopConstraint
     *
     * @throws CoreException
     * @throws CannotAddCombinationException
     * @throws CombinationNotFoundException
     * @throws ProductConstraintException
     */
    public function setDefaultCombination(CombinationId $defaultCombinationId, ShopConstraint $shopConstraint): void
    {
        $newDefaultCombination = $this->combinationRepository->getByShopConstraint($defaultCombinationId, $shopConstraint);
        $productId = new ProductId((int) $newDefaultCombination->id_product);
        $currentDefaultCombination = $this->combinationRepository->findDefaultCombination($productId, $shopConstraint);

        if ($currentDefaultCombination) {
            $this->updateCombinationDefaultProperty($currentDefaultCombination, false, $shopConstraint);
        }

        $this->updateCombinationDefaultProperty($newDefaultCombination, true, $shopConstraint);
    }

    /**
     * @param Combination $combination
     * @param bool $isDefault
     * @param ShopConstraint $shopConstraint
     */
    private function updateCombinationDefaultProperty(Combination $combination, bool $isDefault, ShopConstraint $shopConstraint): void
    {
        $combination->default_on = $isDefault;
        //@todo this probably needs to be done per shop too? (using combinationMultishop repo?)
        $this->combinationRepository->partialUpdate(
            $combination,
            ['default_on'],
            $shopConstraint,
            CannotUpdateCombinationException::FAILED_UPDATE_DEFAULT_COMBINATION
        );
    }
}
