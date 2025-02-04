/**
 * splitter functions
 */

/**
 * Recursively splits text into segments based on a character limit, using an array of separators.
 * @param text - the input string to split.
 * @param separators - array of separators to use for splitting.
 * separator starting with ! will be used as a mandatory separator. E.g "!#" will force splitting on md files header levels.
 * @returns an array of strings with each part having length <= max_char.
 */
export function recursiveCharacterTextSplitter(
  text: string,
  max_word: i32,
  must_split_on: string[] = [],
  split_on: string[] = [],
): string[] {
  // add space as default separator
  split_on.push(" ")
  // sort must_split_on by includin. FOr example ### must be before ## and #
  // TODO

  // we don't expose last_sep to the user, this is an internal variable
  return _recursiveCharacterTextSplitter(text, max_word, must_split_on, split_on)
}

function _recursiveCharacterTextSplitter(
  text: string,
  max_word: i32,
  must_split_on: string[] = [],
  split_on: string[] = [],
  last_sep: string = "",
): string[] {
  let result: string[] = []

  // max_char is the position of the max_word in the text
  const max_char = text.split(" ").slice(0, max_word).join(" ").length
  // console.log(text.slice(0, max_char) + "|");
  // look for the closest mandatory separator in the text within the max_char limit
  // use the longest separator first
  let sep_pos = max_char
  let sep_found = ""

  for (let i = 0; i < must_split_on.length; i++) {
    const sep = must_split_on[i]
    var offset = 0
    if (text.startsWith(sep)) {
      offset = sep.length
    }

    var pos = text.slice(offset, max_char).indexOf(sep)
    if (pos > 0) {
      pos += offset
      // console.log(`found separator [${sep}] at ${pos}`);
      if (pos < sep_pos) {
        sep_found = sep
        sep_pos = pos
      } else if (pos == sep_pos && sep.length > sep_found.length) {
        sep_found = sep
      }
    }
  }
  if (sep_found.length > 0) {
    result.push(last_sep + text.slice(0, sep_pos))
    result = result.concat(
      _recursiveCharacterTextSplitter(
        text.slice(sep_pos + sep_found.length),
        max_word,
        must_split_on,
        split_on,
        sep_found,
      ),
    )
    return result
  }

  // If the text length is less than or equal to the max, return the text as it is
  if (text.length <= max_char) {
    result.push(last_sep + text)
    return result
  }

  // Try to split using the provided optional separators
  let splitIndex: i32 = -1
  let sep = ""
  for (let i = 0; i < split_on.length; i++) {
    sep = split_on[i]
    let pos: i32 = 0
    // Find the last occurrence of the separator within the max character limit
    pos = text.slice(0, max_char).lastIndexOf(sep)

    // If a valid split point is found, set splitIndex and break the loop
    if (pos > 0) {
      splitIndex = pos
      break
    }
  }

  // If no separator was found within the limit, default to splitting at max_char
  if (splitIndex == -1) {
    console.log(`not separator found, splitting at max_char`)
    splitIndex = max_char
    sep = ""
  }

  // Push the first part to the result array
  result.push(last_sep + text.slice(0, splitIndex))

  // Recur for the remaining part of the text
  const remainingText: string = text.slice(splitIndex + sep.length)
  result = result.concat(
    _recursiveCharacterTextSplitter(remainingText, max_word, must_split_on, split_on, sep),
  )

  return result
}

export function mergeSplits(
  splits: string[],
  separator: string,
  chunkSize: i32,
  chunkOverlap: i32,
): string[] {
  let separatorLen: i32 = separator.length
  let docs: string[] = []
  let currentDoc: string[] = []
  let total: i32 = 0

  for (let i = 0; i < splits.length; i++) {
    let d: string = splits[i]
    let dLen: i32 = d.length

    if (total + dLen + (currentDoc.length > 0 ? separatorLen : 0) > chunkSize) {
      if (total > chunkSize) {
        console.warn(
          `Created a chunk of size ${total} which is larger than the chunkSize ${chunkSize}`,
        )
      }
      if (currentDoc.length > 0) {
        let doc: string = currentDoc.join(separator)
        docs.push(doc)

        while (
          total > chunkOverlap ||
          (total + dLen + (currentDoc.length > 0 ? separatorLen : 0) > chunkSize && total > 0)
        ) {
          total -= currentDoc[0].length + (currentDoc.length > 1 ? separatorLen : 0)
          currentDoc.shift()
        }
      }
    }
    total += dLen + (currentDoc.length > 1 ? separatorLen : 0)
    currentDoc.push(d)
  }

  if (currentDoc.length > 0) {
    docs.push(currentDoc.join(separator))
  }

  return docs
}
