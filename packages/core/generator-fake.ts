import { faker } from '@faker-js/faker/locale/zh_CN'

export function generateFakeData(type: string, count: number = 1): unknown[] {
  const generators: Record<string, () => unknown> = {
    name: () => faker.person.fullName(),
    firstName: () => faker.person.firstName(),
    lastName: () => faker.person.lastName(),
    email: () => faker.internet.email(),
    phone: () => faker.phone.number(),
    address: () => faker.location.streetAddress(),
    city: () => faker.location.city(),
    country: () => faker.location.country(),
    company: () => faker.company.name(),
    jobTitle: () => faker.person.jobTitle(),
    username: () => faker.internet.username(),
    password: () => faker.internet.password(),
    url: () => faker.internet.url(),
    ip: () => faker.internet.ipv4(),
    ipv6: () => faker.internet.ipv6(),
    mac: () => faker.internet.mac(),
    uuid: () => faker.string.uuid(),
    date: () => faker.date.recent().toISOString(),
    pastDate: () => faker.date.past().toISOString(),
    futureDate: () => faker.date.future().toISOString(),
    number: () => faker.number.int({ min: 1, max: 1000 }),
    float: () => faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    boolean: () => faker.datatype.boolean(),
    word: () => faker.word.sample(),
    sentence: () => faker.lorem.sentence(),
    paragraph: () => faker.lorem.paragraph(),
    creditCard: () => faker.finance.creditCardNumber(),
    currency: () => faker.finance.currencyCode(),
    bitcoin: () => faker.finance.bitcoinAddress(),
    color: () => faker.internet.color(),
    emoji: () => faker.internet.emoji(),
    avatar: () => faker.image.avatar(),
    imageUrl: () => faker.image.url(),
  }

  const generator = generators[type] || generators.word
  return Array.from({ length: count }, generator)
}

export function generateFakeJson(schema: Record<string, string>, count: number = 1): unknown[] {
  return Array.from({ length: count }, () => {
    const obj: Record<string, unknown> = {}
    for (const [key, type] of Object.entries(schema)) {
      const data = generateFakeData(type, 1)
      obj[key] = data[0]
    }
    return obj
  })
}
