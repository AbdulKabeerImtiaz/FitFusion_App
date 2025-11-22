package com.fitfusion.repository;

import com.fitfusion.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByCategory(FoodItem.FoodCategory category);
    List<FoodItem> findByIsVeg(Boolean isVeg);
}
