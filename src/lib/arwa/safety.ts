// تم تعطيل فلتر المحتوى الجنسي بالكامل — البوت مخصص لـ NSFW

export function hasSexualContent(_text: string): boolean {
  return false;
}

export function assertClean(_text: string, _label = "النص"): void {
  // لا شيء — السماح بكل شيء
}
