import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { assertEmbeddingContract, l2Normalize } from "@/lib/embedding/vector";

export type PreprocessedImageTensor = {
  data: Float32Array;
  dims: [number, number, number, number];
};

export type MobileImageEmbedderOptions = {
  modelPath: string;
  inputName?: string;
  outputName?: string;
};

export type MobileImageEmbedder = {
  embedTensor(tensor: PreprocessedImageTensor): Promise<Float32Array>;
};

export async function createMobileImageEmbedder(
  options: MobileImageEmbedderOptions,
): Promise<MobileImageEmbedder> {
  const session = await InferenceSession.create(options.modelPath);
  const inputName = options.inputName ?? session.inputNames[0];
  const outputName = options.outputName ?? session.outputNames[0];

  if (!inputName || !outputName) {
    throw new Error("The ONNX model must expose at least one input and one output tensor.");
  }

  return {
    async embedTensor(tensor) {
      assertImageTensorShape(tensor);

      const outputs = await session.run({
        [inputName]: new Tensor("float32", tensor.data, tensor.dims),
      });
      const output = outputs[outputName];

      if (!output || !(output.data instanceof Float32Array)) {
        throw new Error(`Model output "${outputName}" did not return Float32Array data.`);
      }

      const embedding = l2Normalize(output.data);
      assertEmbeddingContract(embedding);

      return embedding;
    },
  };
}

export function assertImageTensorShape(tensor: PreprocessedImageTensor) {
  const expectedDims: PreprocessedImageTensor["dims"] = [
    1,
    3,
    EMBEDDING_CONTRACT.imageSize.height,
    EMBEDDING_CONTRACT.imageSize.width,
  ];

  if (tensor.dims.some((dim, index) => dim !== expectedDims[index])) {
    throw new Error(`Expected image tensor dims ${expectedDims.join("x")}, received ${tensor.dims.join("x")}.`);
  }

  const expectedLength = expectedDims.reduce((product, dim) => product * dim, 1);

  if (tensor.data.length !== expectedLength) {
    throw new Error(`Expected image tensor length ${expectedLength}, received ${tensor.data.length}.`);
  }
}

