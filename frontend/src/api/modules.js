
export const reorderModules = (moduleOrders) => 
  api.put('/modules/reorder', moduleOrders).then(r => r.data);

export const reorderLessons = (lessonOrders) => 
  api.put('/lessons/reorder', lessonOrders).then(r => r.data);

export const reorderContentItems = (contentOrders) => 
  api.put('/content-items/reorder', contentOrders).then(r => r.data);
