export const validateTask = (formData) => {
    const errors = [];
    
    if (!formData.title) {
        errors.push('Title is required');
    }
    
    if (formData.title.length > 50) {
        errors.push('Title must be less than 50 characters');
    }
    
    if (!formData.dueDate) {
        errors.push('Due date is required');
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(formData.dueDate);
        
        // Simple check to ensure date is valid
        if (isNaN(selectedDate.getTime())) {
            errors.push('Invalid date format');
        }
    }

    return errors;
};

export const validateSchedule = (formData) => {
    // Add schedule validations here if needed
    const errors = [];
    if (!formData.title) errors.push('Title is required');
    if (!formData.date) errors.push('Date is required');
    if (!formData.startTime) errors.push('Start time is required');
    if (!formData.endTime) errors.push('End time is required');
    
    return errors;
};
