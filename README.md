# mongoose-mini

> A lightweight, high-performance, and minimalized Mongoose MongoDB ODM for Node.js. Pre-bundled into single-file CommonJS and ESM modules for zero bloat, fast startup times, and seamless tree-shaking support.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/thesixers/mongoose-mini)
[![Node Target](https://img.shields.io/badge/node-%3E%3D20.19.0-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Modules](https://img.shields.io/badge/modules-CJS%20%7C%20ESM-orange.svg)](#importing)

---

## Overview

**`mongoose-mini`** provides the full object modeling experience of Mongoose with a minimal runtime footprint. Engineered for modern Node.js environments, `mongoose-mini` comes pre-compiled into optimized CommonJS (`dist/index.js`) and ES Module (`dist/index.mjs`) bundles via `esbuild`, stripping out unnecessary dependencies while retaining maximum performance and developer ergonomics.

### Key Features

- ⚡ **Minimal & Bundled**: High performance with pre-bundled CJS and ESM distributions (`dist/index.js` and `dist/index.mjs`).
- 📦 **Dual Engine Interop**: Fully supports both ES Module `import` and CommonJS `require()` workflows out of the box.
- 📐 **Standard Schema Support**: Compatible with `@standard-schema/spec` for interoperable schema validation across tools.
- 🛡️ **Full Mongoose ODM Power**: Complete support for Schemas, Models, Queries, Middleware (hooks), Population, Virtuals, Aggregations, and Custom Types.
- 📘 **First-Class TypeScript Support**: Full TypeScript definitions included (`types/index.d.ts`).
- 🚀 **Modern Runtime Target**: Requires Node.js `>= 20.19.0`.

---

## Installation

Install `mongoose-mini` using your preferred package manager:

### Using npm

```bash
npm install mongoose-mini
```

### Using pnpm

```bash
pnpm add mongoose-mini
```

### Using Yarn

```bash
yarn add mongoose-mini
```

### Using Bun

```bash
bun add mongoose-mini
```

---

## Quick Start

### 1. Import `mongoose-mini`

**ES Modules (ESM):**
```javascript
import mongooseMini, { Schema } from 'mongoose-mini';
```

**CommonJS (CJS):**
```javascript
const mongooseMini = require('mongoose-mini');
const { Schema } = mongooseMini;
```

### 2. Connect & Define Models

```javascript
import mongooseMini, { Schema } from 'mongoose-mini';

async function run() {
  // Connect to MongoDB
  await mongooseMini.connect('mongodb://127.0.0.1:27017/my_database');
  console.log('Connected to MongoDB!');

  // Define Schema
  const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, min: 18 },
    createdAt: { type: Date, default: Date.now }
  });

  // Create Model
  const User = mongooseMini.model('User', userSchema);

  // Create & Save Document
  const newUser = new User({
    name: 'Alice Smith',
    email: 'alice@example.com',
    age: 28
  });
  await newUser.save();
  console.log('Saved User:', newUser);

  // Query Documents
  const foundUser = await User.findOne({ email: 'alice@example.com' });
  console.log('Found User:', foundUser.name);

  // Clean Up & Disconnect
  await User.deleteOne({ _id: newUser._id });
  await mongooseMini.disconnect();
}

run().catch(console.error);
```

---

## Features & Usage

### Connecting to MongoDB

#### Default Connection

For applications using a single database, use `mongooseMini.connect`:

```javascript
await mongooseMini.connect('mongodb://127.0.0.1:27017/myapp', {
  maxPoolSize: 10
});
```

#### Multiple Connections

For applications requiring multiple database connections, use `mongooseMini.createConnection`:

```javascript
const userDb = mongooseMini.createConnection('mongodb://127.0.0.1:27017/users');
const analyticsDb = mongooseMini.createConnection('mongodb://127.0.0.1:27017/analytics');

const User = userDb.model('User', userSchema);
const Event = analyticsDb.model('Event', eventSchema);
```

---

### Schemas & Validation

`mongoose-mini` supports rich schema definition with built-in and custom validators:

```javascript
import { Schema } from 'mongoose-mini';

const productSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['Electronics', 'Books', 'Clothing']
  },
  tags: [String],
  inStock: {
    type: Boolean,
    default: true
  }
});
```

#### Standard Schema Support

`mongoose-mini` integrates with the `@standard-schema/spec` standard for validation interoperability with libraries like Zod, Valibot, or ArkType.

---

### Middleware (Hooks)

Control logic execution before or after document lifecycle events:

#### Pre-Save Hook

```javascript
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
});
```

#### Post-Save Hook

```javascript
userSchema.post('save', function(doc) {
  console.log(`Document ${doc._id} saved successfully.`);
});
```

---

### Populate (Relationships)

Define references between documents and populate them in queries:

```javascript
const authorSchema = new Schema({
  name: String
});

const postSchema = new Schema({
  title: String,
  author: { type: Schema.Types.ObjectId, ref: 'Author' }
});

const Author = mongooseMini.model('Author', authorSchema);
const Post = mongooseMini.model('Post', postSchema);

// Query with population
const post = await Post.findOne({ title: 'Hello World' }).populate('author');
console.log('Author Name:', post.author.name);
```

---

### Aggregations

Perform complex aggregation pipelines seamlessly:

```javascript
const salesSummary = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$category', totalAmount: { $sum: '$price' } } },
  { $sort: { totalAmount: -1 } }
]);
```

---

### TypeScript Usage

`mongoose-mini` comes with complete type definitions out of the box.

```typescript
import mongooseMini, { Schema, Document, Model } from 'mongoose-mini';

interface IUser extends Document {
  name: string;
  email: string;
  age?: number;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number
});

const User: Model<IUser> = mongooseMini.model<IUser>('User', userSchema);
```

---

## Development & Building

### Running Tests

Execute the test suite using Mocha:

```bash
npm test
```

### Building Distribution Bundles

Generate the CommonJS (`dist/index.js`) and ES Module (`dist/index.mjs`) bundles via `esbuild`:

```bash
npm run build
```

The build output details will be displayed:

- `dist/index.js` (CJS Bundle)
- `dist/index.mjs` (ESM Bundle)

---

## API Summary Exports

`mongoose-mini` exports all standard Mongoose utilities and constructors:

- **Core**: `mongoose` (or `mongooseMini`), `connect`, `disconnect`, `createConnection`, `model`, `deleteModel`
- **Classes**: `Schema`, `Model`, `Document`, `Query`, `Aggregate`, `SchemaType`
- **Types**: `Types`, `ObjectId`, `Decimal128`, `Mixed`
- **Helpers**: `isValidObjectId`, `isObjectIdOrHexString`, `sanitizeFilter`, `trusted`

---

## License

[MIT License](LICENSE.md) - Copyright (c) 2026 Mongoose-Mini Contributors, Automattic & LearnBoost.
