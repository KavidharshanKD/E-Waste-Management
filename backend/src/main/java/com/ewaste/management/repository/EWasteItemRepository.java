package com.ewaste.management.repository;

import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.model.enums.EWasteCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EWasteItemRepository extends JpaRepository<EWasteItem, Long> {
    List<EWasteItem> findByDisposalRequestId(Long requestId);
    List<EWasteItem> findByCategory(EWasteCategory category);
}
