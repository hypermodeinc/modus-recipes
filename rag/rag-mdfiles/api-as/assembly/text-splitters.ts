/**
 * splitter functions
 */

import { DocPage,Chunk, ChunkSection } from "./chunk";


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
  split_on.push(" ");
  // sort must_split_on by includin. FOr example ### must be before ## and #
  // TODO

  // we don't expose last_sep to the user, this is an internal variable
  return _recursiveCharacterTextSplitter(
    text,
    max_word,
    must_split_on,
    split_on,
  );
}

function _recursiveCharacterTextSplitter(
  text: string,
  max_word: i32,
  must_split_on: string[] = [],
  split_on: string[] = [],
  last_sep: string = "",
): string[] {
  let result: string[] = [];

  // max_char is the position of the max_word in the text
  const max_char = text.split(" ").slice(0, max_word).join(" ").length;
  // console.log(text.slice(0, max_char) + "|");
  // look for the closest mandatory separator in the text within the max_char limit
  // use the longest separator first
  let sep_pos = max_char;
  let sep_found = "";

  for (let i = 0; i < must_split_on.length; i++) {
    const sep = must_split_on[i];
    var offset = 0;
    if (text.startsWith(sep)) {
        offset = sep.length;
    }

    var pos = text.slice(offset, max_char).indexOf(sep);
    if (pos > 0) {
      pos += offset;
      // console.log(`found separator [${sep}] at ${pos}`);
      if (pos < sep_pos) {
        sep_found = sep;
        sep_pos = pos;
      } else if (pos == sep_pos && sep.length > sep_found.length) {
        sep_found = sep;
      }
    }
  }
  if (sep_found.length > 0) {
    result.push(last_sep + text.slice(0, sep_pos));
    result = result.concat(
      _recursiveCharacterTextSplitter(
        text.slice(sep_pos + sep_found.length),
        max_word,
        must_split_on,
        split_on,
        sep_found,
      ),
    );
    return result;
  }

  // If the text length is less than or equal to the max, return the text as it is
  if (text.length <= max_char) {
    result.push(last_sep + text);
    return result;
  }

  // Try to split using the provided optional separators
  let splitIndex: i32 = -1;
  let sep = "";
  for (let i = 0; i < split_on.length; i++) {
    sep = split_on[i];
    let pos: i32 = 0;
    // Find the last occurrence of the separator within the max character limit
    pos = text.slice(0, max_char).lastIndexOf(sep);

    // If a valid split point is found, set splitIndex and break the loop
    if (pos > 0) {
      splitIndex = pos;
      break;
    }
  }

  // If no separator was found within the limit, default to splitting at max_char
  if (splitIndex == -1) {
    console.log(`not separator found, splitting at max_char`);
    splitIndex = max_char;
    sep = "";
  }

  // Push the first part to the result array
  result.push(last_sep + text.slice(0, splitIndex));

  // Recur for the remaining part of the text
  const remainingText: string = text.slice(splitIndex + sep.length);
  result = result.concat(
    _recursiveCharacterTextSplitter(
      remainingText,
      max_word,
      must_split_on,
      split_on,
      sep,
    ),
  );

  return result;
}

export function splitMarkdown(
  id: string,
  content: string,
  max_word: i32 = 500,
  namespace: string = ""
): DocPage {
  // using recursiveCharacterTextSplitter
  // create chunck based on the header level
  // unique chunk id is "<id> > L0_1 > L1_1 > L2_3 > line number at this level" -> the 3rd L2 headers in the first L1 header in the document
  
  const section_zero = <ChunkSection>{ id: `${id}>L0_1`, docid: id};
  section_zero.children = [];
  section_zero.chunks = [];
  const doc = <DocPage>{ docid: id, root: section_zero}; 
  var current_section = section_zero;
  const section_path = [section_zero];

  const lines = recursiveCharacterTextSplitter(
    content,
    max_word,
    ["####", "###", "##", "#"],
    ["\n\n", "\n", ";", ","],
  );
  let index_in_level = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // if the line is a header, update the current path
    if (line.startsWith("#")) {
      /* new section 
      * section level = count the number of # at the beginning of the line
      */
      let level:u32 = 1;
      while (line.charAt(level) == "#") {
        level += 1;
      }
      console.log(`new level ${level} current ${current_section.level}`);
      // if the level is lower than the current level, go back to the parent level
      while (level <= current_section.level) {
        if (section_path.length == 0) {
          console.log(`error, no parent section`);
          break;
        } else {
           section_path.pop();
           current_section = section_path[section_path.length - 1];
        }
        console.log(`pop to ${current_section.id} level ${current_section.level}`);
      }
      const index_in_section = current_section.children!.length;
      const section = <ChunkSection>{
        id: `${current_section.id} > L${level}_${index_in_section}`,
        docid: id,
        level: level,
        order: index_in_section,
      };
      section.chunks = [];
      current_section.children!.push(section);
      current_section = section;
      section_path.push(section);
      console.log(`new section ${section.id}`);

    } 
    let order = current_section.chunks.length
    const chunk = <Chunk>{
      id: current_section.id + ">" + order.toString(),
      order: order,
      content: line
    };
    console.log(`adding new chunk ${chunk.id}`);
    current_section.chunks.push(chunk) 
    

  }
  return doc;
}

export function splitMarkdownHeaderText(
  id: string,
  content: string,
  max_word: i32 = 500,
): Chunk[] {
  // using recursiveCharacterTextSplitter
  // create chunck based on the header level
  // unique chunk id is "<id> > L0_1 > L1_1 > L2_3 > line number at this level" -> the 3rd L2 headers in the first L1 header in the document

  const currentPath = [id, "L0_1"];
  const chunks: Chunk[] = [];
  const lines = recursiveCharacterTextSplitter(
    content,
    max_word,
    ["####", "###", "##", "#"],
    ["\n\n", "\n", ";", ","],
  );
  let index_in_level = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // if the line is a header, update the current path
    if (line.startsWith("#")) {
      index_in_level = 0;
      // if the header is at the same level or higher, update the path
      // analyze LX_Y
      let last_path = currentPath[currentPath.length - 1].slice(1);
      let last_path_parts = last_path.split("_");
      let last_level = parseInt(last_path_parts[0]);
      let last_i = parseInt(last_path_parts[1]) as i32;
      // count the number of # at the beginning of the line
      let level = 1;
      while (line.charAt(level) == "#") {
        level += 1;
      }
      let j: i32 = 1;
      while (level <= last_level) {
        currentPath.pop();
        if (level == last_level) {
          j = last_i + 1;
        }
        last_path = currentPath[currentPath.length - 1].slice(1);
        last_path_parts = last_path.split("_");
        last_level = parseInt(last_path_parts[0]) as i32;
        last_i = parseInt(last_path_parts[1]) as i32;
      }
      currentPath.push("L" + level.toString() + "_" + j.toString());
    }
    const chunk = <Chunk>{
      id: currentPath.join(">") + ">" + index_in_level.toString(),
      content: line,
    };
    chunks.push(chunk);
    index_in_level += 1;
  }
  return chunks;
}
