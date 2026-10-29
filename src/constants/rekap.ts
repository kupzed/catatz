// Nama bulan pendek untuk tampilan rekap bulanan (ID default untuk backward compatibility).
export const BULAN_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const BULAN_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type MonthNamesDict = {
  reports?: {
    months?: {
      jan?: string;
      feb?: string;
      mar?: string;
      apr?: string;
      may?: string;
      jun?: string;
      jul?: string;
      aug?: string;
      sep?: string;
      oct?: string;
      nov?: string;
      dec?: string;
    };
  };
};

export function getMonthNames(
  localeOrDict?: MonthNamesDict | string | null,
): string[] {
  if (!localeOrDict) return BULAN_NAMES;
  if (typeof localeOrDict === "string") {
    return localeOrDict.toLowerCase().startsWith("en")
      ? BULAN_NAMES_EN
      : BULAN_NAMES;
  }
  const m = localeOrDict.reports?.months;
  if (
    m &&
    m.jan &&
    m.feb &&
    m.mar &&
    m.apr &&
    m.may &&
    m.jun &&
    m.jul &&
    m.aug &&
    m.sep &&
    m.oct &&
    m.nov &&
    m.dec
  ) {
    return [
      m.jan,
      m.feb,
      m.mar,
      m.apr,
      m.may,
      m.jun,
      m.jul,
      m.aug,
      m.sep,
      m.oct,
      m.nov,
      m.dec,
    ];
  }
  return BULAN_NAMES;
}
