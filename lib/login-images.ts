// Las imágenes ahora se sirven desde /public/login-images/{dia|tarde|noche}
// Mapeamos las carpetas en español a los momentos del día usados por la lógica (day/evening/night)
export const LOGIN_IMAGES = {
  // Día (reemplaza a "day")
  day: [
    "/login-images/dia/dia1.jpeg",
    "/login-images/dia/dia2.jpeg",
    "/login-images/dia/dia3.jpeg",
    "/login-images/dia/dia5.jpeg",
    "/login-images/dia/dia7.jpeg",
  ],
  // Tarde (reemplaza a "evening")
  evening: [
    "/login-images/tarde/tarde1.jpeg",
    "/login-images/tarde/tarde2.jpeg",
    // También se permiten archivos que hayan quedado con nombre distinto en la carpeta
    "/login-images/tarde/dia1.jpeg",
    "/login-images/tarde/dia4.jpeg",
  ],
  // Noche (reemplaza a "night")
  night: [
    "/login-images/noche/noche1.jpeg",
    "/login-images/noche/noche2.jpeg",
    "/login-images/noche/noche3.jpeg",
    "/login-images/noche/Gemini_Generated_Image_5payny5payny5pay.jpeg",
  ],
}

export function getLoginImageByTime(): string {
  const hour = new Date().getHours()
  let imageArray: string[]

  if (hour >= 6 && hour < 18) {
    imageArray = LOGIN_IMAGES.day
  } else if (hour >= 18 && hour < 21) {
    imageArray = LOGIN_IMAGES.evening
  } else {
    imageArray = LOGIN_IMAGES.night
  }

  const randomIndex = Math.floor(Math.random() * imageArray.length)
  return imageArray[randomIndex]
}

export function getGreetingByTime(): string {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 12) {
    return "Buenos días"
  } else if (hour >= 12 && hour < 18) {
    return "Buenas tardes"
  } else {
    return "Buen día"
  }
}
