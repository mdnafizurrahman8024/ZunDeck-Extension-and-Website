export function moveItem(array, fromIndex, toIndex) {
  if (!Array.isArray(array)) return [];
  const list = [...array];
  if (fromIndex < 0 || fromIndex >= list.length) return list;
  if (toIndex < 0 || toIndex >= list.length) return list;
  if (fromIndex === toIndex) return list;

  const [item] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, item);
  return list;
}

export function moveItemUp(array, index) {
  return moveItem(array, index, index - 1);
}

export function moveItemDown(array, index) {
  return moveItem(array, index, index + 1);
}

export function reorderSections(profile, newSectionOrder) {
  if (!profile || !profile.displayConfig) return profile;
  const current = Array.isArray(profile.displayConfig.sectionOrder)
    ? profile.displayConfig.sectionOrder
    : [];

  const validNew = newSectionOrder.filter((sec) => current.includes(sec));
  const remaining = current.filter((sec) => !validNew.includes(sec));

  profile.displayConfig.sectionOrder = [...validNew, ...remaining];
  return profile;
}

export function reorderItems(profile, sectionKey, fromIndex, toIndex) {
  if (!profile) return profile;
  if (!Array.isArray(profile[sectionKey])) return profile;

  profile[sectionKey] = moveItem(profile[sectionKey], fromIndex, toIndex);
  return profile;
}

export function setupDragAndDrop(container, options = {}) {
  if (!container) return { destroy: () => {} };

  const itemSelector = options.itemSelector || '[data-drag-item]';
  const handleSelector = options.handleSelector || '[data-drag-handle]';
  const onReorder = typeof options.onReorder === 'function' ? options.onReorder : () => {};

  let draggedItem = null;
  let draggedIndex = -1;

  function getItems() {
    return Array.from(container.querySelectorAll(itemSelector));
  }

  function handleDragStart(e) {
    const targetItem = e.target.closest(itemSelector);
    if (!targetItem) return;

    draggedItem = targetItem;
    draggedIndex = getItems().indexOf(draggedItem);
    targetItem.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(draggedIndex));
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const overItem = e.target.closest(itemSelector);
    if (!overItem || overItem === draggedItem) return;

    const items = getItems();
    const currIndex = items.indexOf(draggedItem);
    const targetIndex = items.indexOf(overItem);

    if (currIndex === -1 || targetIndex === -1) return;

    const rect = overItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      container.insertBefore(draggedItem, overItem);
    } else {
      container.insertBefore(draggedItem, overItem.nextSibling);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!draggedItem) return;

    const newItems = getItems();
    const newIndex = newItems.indexOf(draggedItem);

    if (draggedIndex !== -1 && newIndex !== -1 && draggedIndex !== newIndex) {
      onReorder(newItems, draggedIndex, newIndex);
    }
  }

  function handleDragEnd() {
    if (draggedItem) {
      draggedItem.classList.remove('is-dragging');
    }
    draggedItem = null;
    draggedIndex = -1;
  }

  // Handle accessible Up / Down button clicks
  function handleClick(e) {
    const btnUp = e.target.closest('[data-action="move-up"]');
    const btnDown = e.target.closest('[data-action="move-down"]');
    if (!btnUp && !btnDown) return;

    const item = (btnUp || btnDown).closest(itemSelector);
    if (!item) return;

    const items = getItems();
    const idx = items.indexOf(item);
    if (idx === -1) return;

    if (btnUp && idx > 0) {
      container.insertBefore(item, items[idx - 1]);
      onReorder(getItems(), idx, idx - 1);
    } else if (btnDown && idx < items.length - 1) {
      container.insertBefore(item, items[idx + 1].nextSibling);
      onReorder(getItems(), idx, idx + 1);
    }
  }

  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('click', handleClick);

  return {
    destroy: () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('click', handleClick);
    }
  };
}
