import i18next from 'i18next';

export const typeLabels = {
    classroom: 'Učilnica',
    vehicle: 'Vozilo',
    teacher: 'Učitelj',
    activity: 'Aktivnost',
    equipment: 'Oprema',
    group: 'Skupina',
};

export const setLabels = {
    rezervacije_fri: 'FRI rezervacije',
    rezervacije_fkkt: 'FKKT rezervacije'
};

export const getTypeLabel = (type) => {
  return i18next.t(`types.${type}`);
};

export const getSetLabel = (set) => {
  return i18next.t(`sets.${set}`);
};

export const getCommonLabel = (key) => {
  return i18next.t(`common.${key}`);
}; 